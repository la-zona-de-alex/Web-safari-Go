const { Connection } = require('tedious');

const config = {
  server: '127.0.0.1',
  options: {
    port: 1433,
    database: 'DB_001',
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 30000
  },
  authentication: {
    type: 'default',
    options: {
      userName: 'webuser',
      password: 'StrongPass123!'
    }
  }
};

const conn = new Connection(config);
console.log('starting tedious connection...');
conn.connect();
conn.on('connect', (err) => {
  if (err) {
    console.error('tedious connect err:', err);
  } else {
    console.log('tedious connected');
    conn.close();
  }
});

conn.on('error', (e) => console.error('tedious error event:', e));
// keep process alive briefly to allow async events
setTimeout(() => {
  console.log('timeout reached, exiting');
  process.exit(0);
}, 10000);
