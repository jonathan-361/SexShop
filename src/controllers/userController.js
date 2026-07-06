const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, names, first_lastname, second_lastname, email, phone, role, status, created_at FROM users LIMIT 15');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, names, first_lastname, second_lastname, email, phone, role, status, created_at FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Register User
exports.register = async (req, res) => {
  const { names, first_lastname, second_lastname, email, password, phone, role } = req.body;
  try {
    // Check if user already exists
    const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const id = crypto.randomUUID();
    await db.query(
      'INSERT INTO users (id, names, first_lastname, second_lastname, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, names, first_lastname, second_lastname, email, hashedPassword, phone, role || 'customer']
    );

    res.status(201).json({ id, message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login User
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find user by email
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Return user info and token
    res.json({
      token,
      user: {
        id: user.id,
        names: user.names,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Legacy/Admin Create user (now consistent with register)
exports.createUser = exports.register;

// Update user
exports.updateUser = async (req, res) => {
  const { names, first_lastname, second_lastname, email, phone, role, status } = req.body;
  try {
    await db.query(
      'UPDATE users SET names = ?, first_lastname = ?, second_lastname = ?, email = ?, phone = ?, role = ?, status = ? WHERE id = ?',
      [names, first_lastname, second_lastname, email, phone, role, status, req.params.id]
    );
    res.json({ message: 'User updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

