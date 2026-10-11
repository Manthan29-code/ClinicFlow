const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');

const generateToken = (id) => jwt.sign(
  { id },
  process.env.JWT_SECRET || 'opd_mini_module_super_secret_jwt_key_2026',
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const register = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    if (typeof name !== 'string' || !name.trim() || typeof phone !== 'string' || !phone.trim()) {
      return errorResponse(res, 400, 'Name and phone are required');
    }

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { name: trimmedName },
          { phone: trimmedPhone }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.name.toLowerCase() === trimmedName.toLowerCase()) {
        return errorResponse(res, 409, 'Name already exists');
      }
      return errorResponse(res, 409, 'Phone already exists');
    }

    const user = await User.create({ name: trimmedName, phone: trimmedPhone });
    return successResponse(res, 201, 'User registered successfully', {
      user: { _id: user.id, name: user.name, phone: user.phone },
      token: generateToken(user.id)
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    if (typeof name !== 'string' || !name.trim() || typeof phone !== 'string' || !phone.trim()) {
      return errorResponse(res, 400, 'Name and phone are required');
    }

    const user = await User.findOne({
      where: { name: name.trim(), phone: phone.trim() }
    });

    if (!user) return errorResponse(res, 401, 'Invalid name or phone');

    return successResponse(res, 200, 'Login successful', {
      user: { _id: user.id, name: user.name, phone: user.phone },
      token: generateToken(user.id)
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    return successResponse(res, 200, 'User profile fetched', {
      _id: req.user.id,
      name: req.user.name,
      phone: req.user.phone
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
