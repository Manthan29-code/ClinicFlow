const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'opd_mini_module_super_secret_jwt_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new user (Staff / Receptionist)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return errorResponse(res, 400, 'Name and phone are required');
    }

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    // Check if user with same name or phone exists
    const existingUser = await User.findOne({
      $or: [{ name: trimmedName }, { phone: trimmedPhone }]
    });

    if (existingUser) {
      if (existingUser.name.toLowerCase() === trimmedName.toLowerCase()) {
        return errorResponse(res, 409, 'Name already exists');
      }
      return errorResponse(res, 409, 'Phone already exists');
    }

    const user = await User.create({
      name: trimmedName,
      phone: trimmedPhone
    });

    const token = generateToken(user._id);

    return successResponse(res, 201, 'User registered successfully', {
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login existing user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return errorResponse(res, 400, 'Name and phone are required');
    }

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    // Match both name and phone
    const user = await User.findOne({
      name: trimmedName,
      phone: trimmedPhone
    });

    if (!user) {
      return errorResponse(res, 401, 'Invalid name or phone');
    }

    const token = generateToken(user._id);

    return successResponse(res, 200, 'Login successful', {
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    return successResponse(res, 200, 'User profile fetched', {
      _id: req.user._id,
      name: req.user.name,
      phone: req.user.phone
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
