const { Doctor } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');

const getDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.findAll({
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'category']
    });
    return successResponse(res, 200, 'Doctors fetched', doctors);
  } catch (error) {
    next(error);
  }
};

const createDoctor = async (req, res, next) => {
  try {
    const { name, category } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof category !== 'string' || !category.trim()) {
      return errorResponse(res, 400, 'Doctor name and category are required');
    }

    const doctor = await Doctor.create({ name: name.trim(), category: category.trim() });
    return successResponse(res, 201, 'Doctor added successfully', doctor);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDoctors, createDoctor };
