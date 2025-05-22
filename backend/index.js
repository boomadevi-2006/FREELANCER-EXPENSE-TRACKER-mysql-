const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '19-Apr-06',
  database: 'freelancer_expense',
  multipleStatements: true
});

connection.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database.');

  // Create user_logs table
  const createUserLogsTable = `
    CREATE TABLE IF NOT EXISTS user_logs (
      log_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      name VARCHAR(100),
      email VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  connection.query(createUserLogsTable, err => {
    if (err) console.error("Error creating user_logs table:", err);
    else console.log("user_logs table ready");
  });

  // Create trigger (workaround without DELIMITER)
  const dropTrigger = `DROP TRIGGER IF EXISTS after_user_signup;`;
  const createTrigger = `
    CREATE TRIGGER after_user_signup
    AFTER INSERT ON users
    FOR EACH ROW
    INSERT INTO user_logs (user_id, name, email)
    VALUES (NEW.id, NEW.name, NEW.email);
  `;

  connection.query(dropTrigger + createTrigger, err => {
    if (err) console.error("Error creating signup trigger:", err.sqlMessage || err);
    else console.log("Signup trigger created");
  });
});

// Signup
app.post('/api/signup', (req, res) => {
  const { name, email, password } = req.body;
  const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
  connection.query(sql, [name, email, password], (err, result) => {
    if (err) return res.status(500).json({ message: 'Signup error' });
    res.status(201).json({ message: 'Signup successful', userId: result.insertId });
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (email.trim() === 'admin@gmail.com' && password === 'admin123') {
    return res.status(200).json({
      message: 'Admin login successful',
      userId: 0,
      role: 'admin'
    });
  }

  const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
  connection.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];
    res.status(200).json({
      message: 'Login successful',
      userId: user.id,
      role: 'user'
    });
  });
});

// Add Expense
app.post('/api/expense', (req, res) => {
  const { userId, title, amount, category, date } = req.body;
  const sql = 'INSERT INTO expenses (user_id, title, amount, category, date) VALUES (?, ?, ?, ?, ?)';
  connection.query(sql, [userId, title, amount, category, date], (err, result) => {
    if (err) return res.status(500).json({ message: 'Failed to add expense' });
    res.status(201).json({ message: 'Expense added successfully' });
  });
});

// Get Expenses
app.get('/api/expenses/:userId', (req, res) => {
  const userId = req.params.userId;
  const sql = 'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC';
  connection.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch expenses' });
    res.json(results);
  });
});

// Delete Expense
app.delete('/api/expense/:id', (req, res) => {
  const sql = 'DELETE FROM expenses WHERE id = ?';
  connection.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Delete failed' });
    res.json({ message: 'Expense deleted' });
  });
});

// Update Expense
app.put('/api/expense/:id', (req, res) => {
  const { title, amount, category, date } = req.body;
  const sql = 'UPDATE expenses SET title = ?, amount = ?, category = ?, date = ? WHERE id = ?';
  connection.query(sql, [title, amount, category, date, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Update failed' });
    res.json({ message: 'Expense updated' });
  });
});

// Show expense update logs for a specific user
app.get("/api/expense-update-logs/:userId", (req, res) => {
  const userId = req.params.userId;
  const sql = "SELECT * FROM expense_update_logs WHERE user_id = ?";
  connection.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Failed to fetch update logs:", err);
      return res.status(500).json({ message: "Error fetching logs" });
    }
    res.json(result);
  });
});

// Admin join: users + expenses
app.get('/api/admin/join', (req, res) => {
  const sql = `
    SELECT u.name, u.email, e.title, e.amount, e.category, e.date
    FROM users u
    JOIN expenses e ON u.id = e.user_id
    ORDER BY e.date DESC
  `;
  connection.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Join failed' });
    res.json(results);
  });
});

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
