const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '22929',
  database: 'system',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database');

  db.query('SELECT @@port AS port, @@datadir AS dataDir, @@version AS version', (err, result) => {
            if (err) {
                console.log(err);
            } else {
                console.log('DB Info:', result);
            }
        });
});



module.exports = db;
