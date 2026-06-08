require('dotenv').config();
const util = require('util');
const mssql = require('mssql');

(async () => {
  const conn = process.env.MSSQL_CONN;
  console.log('Using MSSQL_CONN=', conn);

  // Try msnodesqlv8 first
  try {
    console.log('Testing msnodesqlv8...');
    const native = require('mssql/msnodesqlv8');
    try {
      const pool = await native.connect(conn);
      const r = await pool.request().query('SELECT TOP 1 name FROM sys.databases');
      console.log('msnodesqlv8 success:', util.inspect(r.recordset, { depth: null }));
      await pool.close();
    } catch (e) {
      console.error('msnodesqlv8 connect/query error:', util.inspect(e, { depth: null }));
      try {
        console.error('msnodesqlv8 error keys:', Object.getOwnPropertyNames(e));
        console.error('msnodesqlv8 e.name:', e.name);
        console.error('msnodesqlv8 e.code:', e.code);
        console.error('msnodesqlv8 e.message:', util.inspect(e.message, { depth: null }));
        console.error('msnodesqlv8 e.stack:', e.stack);
        if (e && e.originalError) console.error('originalError:', util.inspect(e.originalError, { depth: null }));
        if (e && e.originalError && e.originalError.info) console.error('originalError.info:', util.inspect(e.originalError.info, { depth: null }));
      } catch (x) { console.error('inspect failure', x); }
    }
  } catch (e) {
    console.error('require msnodesqlv8 failed:', util.inspect(e, { depth: null }));
  }

  // Try msnodesqlv8 with config object
  try {
    console.log('Testing msnodesqlv8 with config object...');
    const native2 = require('mssql/msnodesqlv8');
    const cfg = {
      server: '127.0.0.1',
      port: 1433,
      database: 'DB_001',
      driver: 'msnodesqlv8',
      options: {
        trustedConnection: true,
        trustServerCertificate: true
      }
    };
    try {
      const pool3 = await native2.connect(cfg);
      const rr = await pool3.request().query('SELECT TOP 1 name FROM sys.databases');
      console.log('msnodesqlv8 config success:', util.inspect(rr.recordset, { depth: null }));
      await pool3.close();
    } catch (e) {
      console.error('msnodesqlv8 config error:', util.inspect(e, { depth: null }));
    }
  } catch (e) {
    console.error('msnodesqlv8 require failed (config path):', util.inspect(e, { depth: null }));
  }

  // Try tedious (mssql default)
  try {
    console.log('Testing tedious (mssql.connect)...');
    try {
      const pool2 = await mssql.connect(conn);
      const r2 = await pool2.request().query('SELECT TOP 1 name FROM sys.databases');
      console.log('tedious success:', util.inspect(r2.recordset, { depth: null }));
      await pool2.close();
    } catch (e) {
      console.error('tedious connect/query error:', util.inspect(e, { depth: null }));
      try {
        console.error('tedious error keys:', Object.getOwnPropertyNames(e));
        console.error('tedious e.name:', e.name);
        console.error('tedious e.code:', e.code);
        console.error('tedious e.message:', util.inspect(e.message, { depth: null }));
        console.error('tedious e.stack:', e.stack);
        if (e && e.originalError) console.error('originalError:', util.inspect(e.originalError, { depth: null }));
        if (e && e.originalError && e.originalError.info) console.error('originalError.info:', util.inspect(e.originalError.info, { depth: null }));
      } catch (x) { console.error('inspect failure', x); }
    }
  } catch (e) {
    console.error('mssql require failed:', util.inspect(e, { depth: null }));
  }

  process.exit(0);
})();
