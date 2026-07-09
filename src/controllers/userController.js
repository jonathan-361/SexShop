const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// ========================================================
// GET ALL USERS (Solo Admin) (Con Paginación)
// ========================================================
exports.getAllUsers = async (req, res) => {
  const { page = 1, limit = 15 } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 15;
  const offset = (pageNum - 1) * limitNum;

  try {
    const [rows] = await db.query(
      "SELECT id, names, first_lastname, second_lastname, email, phone, role, status, created_at FROM users LIMIT ? OFFSET ?",
      [limitNum, offset],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================================
// GET USER BY ID (Solo Admin)
// ========================================================
exports.getUserById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, names, first_lastname, second_lastname, email, phone, role, status, created_at FROM users WHERE id = ?",
      [req.params.id],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================================
// REGISTER / CREATE USER (Público - Fuerza 'customer')
// ========================================================
// ========================================================
// REGISTER / CREATE USER (Público - Fuerza 'customer')
// ========================================================
// ========================================================
// REGISTER / CREATE USER (Público - Fuerza 'customer')
// ========================================================
exports.register = async (req, res) => {
  const {
    names,
    first_lastname,
    second_lastname,
    email,
    password,
    phone,
    role,
  } = req.body;

  // REGLA: Si envían un rol y es diferente a 'customer', rechazar la petición de inmediato
  if (role && role !== "customer") {
    return res.status(400).json({
      message:
        'Operación no permitida. El registro público solo permite el rol "customer".',
    });
  }

  try {
    // Verificar si el usuario ya existe
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );
    if (existingUser.length > 0) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const id = crypto.randomUUID();

    // Forzamos que en la BD se guarde como customer
    const finalRole = "customer";

    await db.query(
      "INSERT INTO users (id, names, first_lastname, second_lastname, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        names,
        first_lastname,
        second_lastname,
        email,
        hashedPassword,
        phone,
        finalRole,
      ],
    );

    res.status(201).json({ id, message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================================
// LOGIN USER (Público)
// ========================================================
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        names: user.names,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Clon de seguridad heredado
exports.createUser = exports.register;

// ========================================================
// UPDATE USER (Solo Admin - Puede cambiar roles a admin/customer)
// ========================================================
exports.updateUser = async (req, res) => {
  const { names, first_lastname, second_lastname, email, phone, role, status } =
    req.body;
  const userIdToUpdate = req.params.id;

  try {
    // Validar de forma estricta que solo acepte los dos roles de tu Base de Datos actual
    const rolesPermitidos = ["customer", "admin"];
    if (role && !rolesPermitidos.includes(role)) {
      return res.status(400).json({
        message: `Rol no válido. Los únicos roles permitidos en el sistema son: ${rolesPermitidos.join(", ")}.`,
      });
    }

    const [result] = await db.query(
      "UPDATE users SET names = ?, first_lastname = ?, second_lastname = ?, email = ?, phone = ?, role = ?, status = ? WHERE id = ?",
      [
        names,
        first_lastname,
        second_lastname,
        email,
        phone,
        role,
        status,
        userIdToUpdate,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully by the administrator." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================================
// DELETE USER (Solo Admin)
// ========================================================
exports.deleteUser = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
