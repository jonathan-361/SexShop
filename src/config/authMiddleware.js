const jwt = require('jsonwebtoken');

/**
 * authMiddleware — Verifica el token JWT en el header Authorization.
 * Si es válido, inyecta req.user = { id, role } para uso en controladores.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

/**
 * requireRole — Middleware de autorización por rol.
 * Debe ir después de authMiddleware.
 * @param {...string} roles — roles permitidos, ej: requireRole('admin') o requireRole('admin','store_owner')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Acceso restringido. Se requiere rol: ${roles.join(' o ')}.` });
  }
  next();
};

module.exports = authMiddleware;
module.exports.requireRole = requireRole;
