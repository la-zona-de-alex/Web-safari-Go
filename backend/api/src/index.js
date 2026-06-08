require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const mssql = require('mssql');
const util = require('util');

// Helper para elegir driver cuando se usa Integrated Security en Windows
async function getPool(connectionString) {
	if (!connectionString) return null;
	const integrated = /Integrated Security|Trusted_Connection|IntegratedSecurity/i.test(connectionString);
	if (integrated) {
		try {
			const mssqlNative = require('mssql/msnodesqlv8');
			return await mssqlNative.connect(connectionString);
		} catch (e) {
			console.warn('msnodesqlv8 no disponible, intentando driver por defecto:', util.inspect(e, { depth: null }));
			try {
				return await mssql.connect(connectionString);
			} catch (err) {
				console.error('Error al conectar con driver por defecto:', util.inspect(err, { depth: null }));
				throw err;
			}
		}
	}

	// If SQL Auth is present, build a config object and force tedious driver
	const hasSqlAuth = /User\s*Id|User|Password/i.test(connectionString);
	if (hasSqlAuth) {
		// simple parser for common keys
		const kv = {};
		connectionString.split(';').forEach(part => {
			const [k, ...rest] = part.split('=');
			if (!k) return;
			kv[k.trim().toLowerCase()] = rest.join('=').trim();
		});
		let serverRaw = kv['server'] || kv['data source'] || kv['datasource'] || kv['data-source'];
		let server = serverRaw || '127.0.0.1';
		let port = undefined;
		if (server && server.includes(',')) {
			const parts = server.split(',');
			server = parts[0];
			port = parseInt(parts[1], 10);
		}
		const config = {
			user: kv['user id'] || kv['user'] || '',
			password: kv['password'] || '',
			server: server,
			database: kv['initial catalog'] || kv['database'] || '',
			options: {
				encrypt: (kv['encrypt'] || '').toLowerCase() === 'true',
				trustServerCertificate: (kv['trust server certificate'] || '').toLowerCase() === 'true'
			}
		};
		if (port) config.options.port = port;
		try {
			return await mssql.connect(config);
		} catch (err) {
			console.error('mssql.connect(config) failed:', util.inspect(err, { depth: null }));
			throw err;
		}
	}

	// fallback: try raw connection string
	return await mssql.connect(connectionString);
}

const app = express();
app.use(cors());
app.use(express.json());

// Google OAuth settings (optional)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT = process.env.GOOGLE_REDIRECT || `http://localhost:4000/api/auth/google/callback`;

// expose uploaded files

// storage for uploads with file validation
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, UPLOAD_DIR),
	filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

function fileFilter(req, file, cb) {
	// accept only images
	if (!file.mimetype || !file.mimetype.startsWith('image/')) return cb(new Error('invalid_file_type'));
	cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// serve uploaded files
app.use('/uploads', express.static(UPLOAD_DIR));

// Simple in-memory store for demo when DB not configured
const users = new Map();

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'backend-api' }));

// Endpoint de registro: admite roles passenger/driver/admin y archivos para conductores
app.post('/api/register', upload.fields([{ name: 'vehicle_photo' }, { name: 'license_photo' }, { name: 'driver_photo' }, { name: 'dni_photo' }, { name: 'passenger_photo' }]), async (req, res) => {
	try {
		const { name, email, password, role } = req.body;
		if (!email || !password || !role) return res.status(400).json({ error: 'email,password,role required' });

		// Prevent creating admin accounts via public register endpoint
		if (String(role).toLowerCase() === 'admin') return res.status(403).json({ error: 'admin accounts must be created manually' });

		// If registering as driver, ensure required files are present
		if (String(role).toLowerCase() === 'driver') {
			const required = ['vehicle_photo', 'license_photo', 'driver_photo', 'dni_photo'];
			const missing = required.filter(k => !(req.files && req.files[k] && req.files[k].length));
			if (missing.length) return res.status(400).json({ error: 'missing driver files', missing });
		}

		const hashed = await bcrypt.hash(password, 10);

		const user = { id: Date.now(), name, email, password: hashed, role, created_at: new Date().toISOString(), verified: String(role).toLowerCase() === 'driver' ? false : true };

		// attach uploaded files meta
		if (req.files) {
			user.files = Object.fromEntries(Object.entries(req.files).map(([k,v])=>[k,v.map(f=>({path:f.path,originalName:f.originalname}))]));
		}

		// Si existe cadena de conexión MSSQL, se intentará guardar en la base de datos
		const mssqlConn = process.env.MSSQL_CONN || process.env.DB_DRIVER_CONN;
		const dabUrl = process.env.DAB_URL;
		if (mssqlConn) {
			// intentar insertar en MSSQL de forma robusta
			try {
				const pool = await getPool(mssqlConn);
				let insertedId = null;
				// primer intento: con columna verified (si existe)
				try {
					const r = await pool.request()
						.input('name', mssql.NVarChar(200), user.name)
						.input('email', mssql.NVarChar(200), user.email)
						.input('password', mssql.NVarChar(500), user.password)
						.input('role', mssql.NVarChar(50), user.role)
						.input('verified', mssql.Bit, user.verified ? 1 : 0)
						.query('INSERT INTO dbo.Users (name, email, password, role, verified, created_at) OUTPUT INSERTED.user_id VALUES (@name, @email, @password, @role, @verified, SYSUTCDATETIME())');
					insertedId = r && r.recordset && r.recordset[0] && r.recordset[0].user_id;
				} catch (e) {
					// fallback: intentar sin verified
					try {
						const r2 = await pool.request()
							.input('name', mssql.NVarChar(200), user.name)
							.input('email', mssql.NVarChar(200), user.email)
							.input('password', mssql.NVarChar(500), user.password)
							.input('role', mssql.NVarChar(50), user.role)
							.query('INSERT INTO dbo.Users (name, email, password, role, created_at) OUTPUT INSERTED.user_id VALUES (@name, @email, @password, @role, SYSUTCDATETIME())');
						insertedId = r2 && r2.recordset && r2.recordset[0] && r2.recordset[0].user_id;
					} catch (err2) {
						console.error('Error inserting user into MSSQL', util.inspect(err2, { depth: null }));
						throw err2;
					}
				}

				if (insertedId) user.id = insertedId;

				// save files metadata into DriverFiles table (if user.id resolved)
				if (user.files && user.id) {
					for (const [fileType, fileArr] of Object.entries(user.files)) {
						for (const f of fileArr) {
							try {
								await pool.request()
									.input('user_id', mssql.Int, user.id)
									.input('file_type', mssql.NVarChar(100), fileType)
									.input('file_path', mssql.NVarChar(500), f.path)
									.input('original_name', mssql.NVarChar(255), f.originalName)
									.query('INSERT INTO dbo.DriverFiles (user_id, file_type, file_path, original_name, uploaded_at) VALUES (@user_id, @file_type, @file_path, @original_name, SYSUTCDATETIME())');
							} catch (fileErr) {
								console.warn('Failed to save DriverFiles entry, continuing', fileErr && fileErr.message)
							}
						}
					}
				}

			} catch (dbErr) {
				console.error('Error MSSQL during register', util.inspect(dbErr, { depth: null }));
				// Fallback: save in-memory when DB insert fails (development-friendly)
				users.set(user.id, user);
				console.warn('Saved user in-memory due to DB error (development fallback)');
			}
		} else if (dabUrl) {
			// TODO: implementar llamada a DAB REST si se prefiere usar DAB
			console.log('DAB_URL presente; implementar creación mediante DAB si se desea.');
		} else {
			users.set(user.id, user);
		}

		return res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, verified: user.verified } });
		} catch (e) {
			console.error('Register error', util.inspect(e, { depth: null }));
			return res.status(500).json({ error: 'server error' });
		}
});

// Google OAuth minimal flow (requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in env)
app.get('/api/auth/google', (req, res) => {
	if (typeof GOOGLE_CLIENT_ID === 'undefined' || !GOOGLE_CLIENT_ID) return res.status(501).json({ error: 'google_oauth_not_configured' });
	const state = Math.random().toString(36).slice(2);
	const scope = encodeURIComponent('profile email');
	const redirect = encodeURIComponent(GOOGLE_REDIRECT);
	const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;
	res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
	const code = req.query.code;
	if (!code) return res.status(400).send('missing code');
	if ((typeof GOOGLE_CLIENT_ID === 'undefined') || (typeof GOOGLE_CLIENT_SECRET === 'undefined') || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return res.status(501).send('google oauth not configured');
	try {
		// exchange code for tokens
		const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, redirect_uri: GOOGLE_REDIRECT, grant_type: 'authorization_code' })
		});
		const tokenJson = await tokenRes.json();
		const accessToken = tokenJson.access_token;
		if (!accessToken) return res.status(500).send('failed_token');

		// fetch profile
		const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo?access_token=' + encodeURIComponent(accessToken));
		const profile = await profileRes.json();
		if (!profile || !profile.email) return res.status(500).send('failed_profile');

		// find or create user (default role: passenger)
		let existing = Array.from(users.values()).find(u => u.email === profile.email);
		if (!existing) {
			const u = { id: Date.now(), name: profile.name || profile.email, email: profile.email, password: '', role: 'passenger', verified: true, created_at: new Date().toISOString() };
			users.set(u.id, u);
			existing = u;
		}

		const token = jwt.sign({ sub: existing.id, role: existing.role, email: existing.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

		// render small HTML that posts token/user to the opener window (popup flow)
		const frontend = process.env.FRONTEND_ORIGIN || 'http://localhost:5175';
		const payload = { token: token, user: { id: existing.id, name: existing.name, email: existing.email, role: existing.role, verified: existing.verified } };
		const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
			try{
				if (window.opener && window.opener.postMessage) {
					window.opener.postMessage(${JSON.stringify(payload)}, ${JSON.stringify(frontend)});
				}
			} catch(e) {}
			try { window.close(); } catch(e) { window.location = ${JSON.stringify(frontend + '#/')}; }
		</script></body></html>`;
		res.send(html);
	} catch (e) {
		console.error('Google OAuth callback error', e);
		res.status(500).send('oauth_error');
	}
});

// Login endpoint: checks in-memory store or can be extended for MSSQL/DAB
app.post('/api/login', async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) return res.status(400).json({ error: 'email and password required' });

	const mssqlConn = process.env.MSSQL_CONN || process.env.DB_DRIVER_CONN;
	if (mssqlConn) {
		try {
			const pool = await getPool(mssqlConn);
			const result = await pool.request()
				.input('email', mssql.NVarChar(200), email)
				.query('SELECT user_id AS id, name, email, password, role, verified FROM dbo.Users WHERE email = @email');

			const row = result.recordset && result.recordset[0];
			if (row) {
				const ok = await bcrypt.compare(password, row.password);
				if (!ok) return res.status(401).json({ error: 'invalid credentials' });
				// If DB has verified flag, check it and block driver until verified
				if (row.role === 'driver' && (row.verified === 0 || row.verified === false)) {
					return res.status(403).json({ error: 'driver_verification_pending' });
				}
				const token = jwt.sign({ sub: row.id, role: row.role, email: row.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
				return res.json({ ok: true, token, user: { id: row.id, name: row.name || null, email: row.email, role: row.role } });
			}
			// if no DB row found, fall through to in-memory fallback
		} catch (e) {
			console.error(e);
			return res.status(500).json({ error: 'server error' });
		}
	}

	// fallback to in-memory
	const u = Array.from(users.values()).find(x => x.email === email);
	if (!u) return res.status(401).json({ error: 'invalid credentials' });
	const ok = await bcrypt.compare(password, u.password);
	if (!ok) return res.status(401).json({ error: 'invalid credentials' });

	// block unverified drivers
	if (u.role === 'driver' && u.verified === false) return res.status(403).json({ error: 'driver_verification_pending' });

		const token = jwt.sign({ sub: u.id, role: u.role, email: u.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
		// include passenger photo url if available
		let photo = null
		if (u.files && u.files.passenger_photo && u.files.passenger_photo.length) {
			const f = u.files.passenger_photo[0]
			photo = '/uploads/' + path.basename(f.path)
		}
		return res.json({ ok: true, token, user: { id: u.id, name: u.name || null, email: u.email, role: u.role, verified: u.verified, photo } });
});

// Simple protected endpoint example
app.get('/api/me', (req, res) => {
	const auth = req.headers.authorization;
	if (!auth) return res.status(401).json({ error: 'missing auth' });
	const token = auth.split(' ')[1];
	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
		const user = users.get(payload.sub);
		return res.json({ ok: true, user });
	} catch (e) {
		return res.status(401).json({ error: 'invalid token' });
	}
});

// helper: obtener payload desde token
function getPayloadFromReq(req) {
	const auth = req.headers.authorization;
	if (!auth) return null;
	const token = auth.split(' ')[1];
	try {
		return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
	} catch (e) {
		return null;
	}
}

// Crear una nueva solicitud de viaje (passenger)
app.post('/api/rides', async (req, res) => {
	const payload = getPayloadFromReq(req);
	const passengerId = payload ? payload.sub : req.body.passenger_id;
	if (!passengerId) return res.status(400).json({ error: 'passenger_id required (or send Authorization header)' });

	const { origin_address, dest_address, price } = req.body;

	const mssqlConn = process.env.MSSQL_CONN || process.env.DB_DRIVER_CONN;
	if (mssqlConn) {
		try {
			const pool = await getPool(mssqlConn);
			const q = 'INSERT INTO dbo.RideRequests (passenger_id, origin_lat, origin_lng, dest_lat, dest_lng, status, requested_at, price, origin_address, dest_address) VALUES (@passenger_id, NULL, NULL, NULL, NULL, @status, SYSUTCDATETIME(), @price, @origin_address, @dest_address); SELECT SCOPE_IDENTITY() AS id;';
			const result = await pool.request()
				.input('passenger_id', mssql.Int, passengerId)
				.input('status', mssql.NVarChar(50), 'pending')
				.input('price', mssql.Decimal(10,2), price || null)
				.input('origin_address', mssql.NVarChar(500), origin_address || null)
				.input('dest_address', mssql.NVarChar(500), dest_address || null)
				.query(q);
			const id = result.recordset && result.recordset[0] && result.recordset[0].id;
			return res.json({ ok: true, rideId: id });
		} catch (e) {
			console.error('Ride create error', util.inspect(e, { depth: null }));
			return res.status(500).json({ error: 'db error' });
		}
	}

	// in-memory fallback
	const id = Date.now();
	const ride = { id, passenger_id: passengerId, origin_address, dest_address, price, status: 'pending', requested_at: new Date().toISOString() };
	if (!global._rides) global._rides = new Map();
	global._rides.set(id, ride);
	return res.json({ ok: true, ride });
});

// Listar solicitudes (filter por estado o por usuario)
app.get('/api/rides', async (req, res) => {
	const { status, passenger_id } = req.query;
	const mssqlConn = process.env.MSSQL_CONN || process.env.DB_DRIVER_CONN;
	if (mssqlConn) {
		try {
			const pool = await getPool(mssqlConn);
			let q = 'SELECT request_id AS id, passenger_id, driver_id, status, requested_at, matched_at, completed_at, price, origin_address, dest_address FROM dbo.RideRequests';
			const request = pool.request();
			const clauses = [];
			if (status) { clauses.push('status = @status'); request.input('status', mssql.NVarChar(50), status); }
			if (passenger_id) { clauses.push('passenger_id = @passenger_id'); request.input('passenger_id', mssql.Int, passenger_id); }
			if (clauses.length) q += ' WHERE ' + clauses.join(' AND ');
			const r = await request.query(q);
			return res.json({ ok: true, rides: r.recordset });
		} catch (e) {
			console.error('Ride list error', util.inspect(e, { depth: null }));
			return res.status(500).json({ error: 'db error' });
		}
	}

	const all = Array.from((global._rides && global._rides.values()) || []);
	const filtered = all.filter(r => (status ? r.status === status : true) && (passenger_id ? String(r.passenger_id) === String(passenger_id) : true));
	return res.json({ ok: true, rides: filtered });
});

// Driver acepta un ride
app.post('/api/rides/:id/accept', async (req, res) => {
	const payload = getPayloadFromReq(req);
	const driverId = payload ? payload.sub : req.body.driver_id;
	if (!driverId) return res.status(400).json({ error: 'driver_id required (or send Authorization header)' });
	const id = req.params.id;

	const mssqlConn = process.env.MSSQL_CONN || process.env.DB_DRIVER_CONN;
	if (mssqlConn) {
		try {
			const pool = await getPool(mssqlConn);
			await pool.request()
				.input('id', mssql.Int, id)
				.input('driver_id', mssql.Int, driverId)
				.input('status', mssql.NVarChar(50), 'matched')
				.query('UPDATE dbo.RideRequests SET driver_id = @driver_id, status = @status, matched_at = SYSUTCDATETIME() WHERE request_id = @id');
			return res.json({ ok: true });
		} catch (e) {
			console.error('Ride accept error', util.inspect(e, { depth: null }));
			return res.status(500).json({ error: 'db error' });
		}
	}

	const ride = global._rides && global._rides.get(Number(id));
	if (!ride) return res.status(404).json({ error: 'not found' });
	ride.driver_id = driverId; ride.status = 'matched'; ride.matched_at = new Date().toISOString();
	return res.json({ ok: true, ride });
});

app.listen(4000, () => console.log('Backend API running on http://localhost:4000'));

// Seed demo users (only when using in-memory store and empty)
async function seedDemoUsers() {
	if (users.size) return;
	const passHash = await bcrypt.hash('password', 10);
	const admin = { id: 1001, name: 'Admin Demo', email: 'admin@local', password: passHash, role: 'admin', verified: true, created_at: new Date().toISOString() };
	const driver = { id: 1002, name: 'Driver Demo', email: 'driver@local', password: passHash, role: 'driver', verified: true, created_at: new Date().toISOString() };
	const passenger = { id: 1003, name: 'Passenger Demo', email: 'passenger@local', password: passHash, role: 'passenger', verified: true, created_at: new Date().toISOString() };
	users.set(admin.id, admin);
	users.set(driver.id, driver);
	users.set(passenger.id, passenger);
	console.log('Seeded demo users: admin@local, driver@local, passenger@local (password: password)');
}

seedDemoUsers().catch(e => console.error('Seed error', e));

// Admin endpoint: verify a user (requires admin JWT)
app.post('/api/admin/users/:id/verify', async (req, res) => {
	const payload = getPayloadFromReq(req);
	if (!payload || payload.role !== 'admin') return res.status(403).json({ error: 'admin_required' });
	const id = Number(req.params.id);
	if (!id) return res.status(400).json({ error: 'invalid id' });

	const mssqlConn = process.env.MSSQL_CONN || process.env.DB_DRIVER_CONN;
	if (mssqlConn) {
		try {
			const pool = await getPool(mssqlConn);
			await pool.request()
				.input('id', mssql.Int, id)
				.query('UPDATE dbo.Users SET verified = 1 WHERE user_id = @id');
			return res.json({ ok: true });
		} catch (e) {
			console.error('DB verify error', e);
			return res.status(500).json({ error: 'db error' });
		}
	}

	const u = users.get(id);
	if (!u) return res.status(404).json({ error: 'not found' });
	u.verified = true;
	users.set(id, u);
	return res.json({ ok: true });
});

// Comments storage (simple file-backed for demo)
const COMMENTS_DIR = path.join(__dirname, '..', 'data');
const COMMENTS_FILE = path.join(COMMENTS_DIR, 'comments.json');
if (!fs.existsSync(COMMENTS_DIR)) fs.mkdirSync(COMMENTS_DIR, { recursive: true });

async function loadComments() {
	try {
		const raw = await fs.promises.readFile(COMMENTS_FILE, 'utf8');
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) return parsed;
		return [];
	} catch (e) {
		// seed with examples if file doesn't exist or is invalid
		return [
			{ id: 1, name: 'Ana', text: 'Excelente servicio, conductor muy amable.', avatar: '/images/logo.png', created_at: new Date().toISOString() },
			{ id: 2, name: 'Luis', text: 'Llegaron rápido y el viaje fue cómodo.', avatar: '/images/logo.png', created_at: new Date().toISOString() }
		];
	}
}

async function saveComments(arr) {
	try {
		await fs.promises.writeFile(COMMENTS_FILE, JSON.stringify(arr, null, 2), 'utf8');
	} catch (e) {
		console.error('Error saving comments', e);
		throw e;
	}
}

app.get('/api/comments', async (req, res) => {
	try {
		const comments = await loadComments();
		return res.json({ ok: true, comments });
	} catch (e) {
		console.error('Comments list error', e);
		return res.status(500).json({ error: 'server error' });
	}
});

app.post('/api/comments', async (req, res) => {
	try {
		const payload = getPayloadFromReq(req);
		if (!payload) return res.status(401).json({ error: 'missing auth' });
		const { name, text, avatar } = req.body || {};
		if (!text || !String(text).trim()) return res.status(400).json({ error: 'text required' });
		const list = await loadComments();
		const id = Date.now();
		// use authenticated user's name/email as author when available
		const author = payload && payload.email ? (payload.name || payload.email) : (name || 'Anónimo');
		const comment = { id, name: author, text: String(text).trim(), avatar: avatar || '/images/logo.png', created_at: new Date().toISOString() };
		list.push(comment);
		await saveComments(list);
		return res.json({ ok: true, comment });
	} catch (e) {
		console.error('Comments create error', e);
		return res.status(500).json({ error: 'server error' });
	}
});
