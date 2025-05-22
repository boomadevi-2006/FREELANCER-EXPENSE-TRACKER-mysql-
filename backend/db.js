const mysql = require('mysql2');

const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '19-Apr-06',
  database: 'freelancer_expense'
});

conn.connect(err => {
  if (err) throw err;
  console.log('MySQL connected');
});

module.exports = conn;
