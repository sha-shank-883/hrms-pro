const { pool } = require('./src/config/database'); 
pool.query('UPDATE "tenant_default".users SET password_hash = $1 WHERE email IN ($2, $3)', ['$2b$10$ItxGKp3oHkTElQPhjXDWL.39ycstF4eFRTlu0FlRwfPDyITu46qOq', 'admin@hrmspro.com', 'test.rbac@example.com'])
.then(() => { 
  console.log('Fixed DB Hashes!'); 
  pool.end(); 
})
.catch(e => console.error(e));
