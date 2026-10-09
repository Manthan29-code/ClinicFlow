const Doctor = require('../models/Doctor');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get all doctors sorted by name
// @route   GET /api/doctors
// @access  Private
const getDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().sort({ name: 1 }).select('_id name category');
    return successResponse(res, 200, 'Doctors fetched', doctors);
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new doctor
// @route   POST /api/doctors
// @access  Private
const createDoctor = async (req, res, next) => {
  try {
    const { name, category } = req.body;

    if (!name || !category) {
      return errorResponse(res, 400, 'Doctor name and category are required');
    }

    const doctor = await Doctor.create({
      name: name.trim(),
      category: category.trim()
    });

    return successResponse(res, 201, 'Doctor added successfully', {
      _id: doctor._id,
      name: doctor.name,
      category: doctor.category
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  createDoctor
};
