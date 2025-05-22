const express = require('express');
const router = express.Router();
const db = require('../db');

// Signup
router.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, password], (err) => {
    if (err) return res.status(500).send("Signup error");
    res.send({ message: "User registered" });
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, results) => {
    if (err) return res.status(500).send("Login error");
    if (results.length > 0) {
      res.send({ success: true, userId: results[0].id });
    } else {
      res.send({ success: false });
    }
  });
});

// Add Expense
router.post('/expense', (req, res) => {
  const { userId, title, amount, category, date } = req.body;
  db.query("INSERT INTO expenses (user_id, title, amount, category, date) VALUES (?, ?, ?, ?, ?)",
    [userId, title, amount, category, date], (err) => {
      if (err) return res.status(500).send("Expense error");
      res.send({ message: "Expense added" });
    });
});

// Get Expenses
router.get('/expenses/:userId', (req, res) => {
  db.query("SELECT * FROM expenses WHERE user_id = ?", [req.params.userId], (err, results) => {
    if (err) return res.status(500).send("Fetch error");
    res.send(results);
  });
});

module.exports = router;
