const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { errorResponse } = require('../utils/response');

const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;

  if (!token) {
    return errorResponse(res, 401, 'Not authorized, token missing');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'opd_mini_module_super_secret_jwt_key_2026');
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return errorResponse(res, 401, 'Not authorized, user not found');
    }

    req.user = user;
    return next();
  } catch (error) {
    return errorResponse(res, 401, 'Not authorized, token invalid');
  }
};

module.exports = { protect };
