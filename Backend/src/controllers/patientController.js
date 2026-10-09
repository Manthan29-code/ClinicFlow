const Patient = require('../models/Patient');
const { successResponse, errorResponse } = require('../utils/response');
const { escapeRegex } = require('../utils/dateRange');

// @desc    Register a new patient
// @route   POST /api/patients
// @access  Private
const createPatient = async (req, res, next) => {
  try {
    const { name, gender, age, phone } = req.body;

    const patient = await Patient.create({
      name: name?.trim(),
      gender,
      age: Number(age),
      phone: phone?.trim()
    });

    return successResponse(res, 201, 'Patient registered successfully', {
      _id: patient._id,
      name: patient.name,
      gender: patient.gender,
      age: patient.age,
      phone: patient.phone,
      createdAt: patient.createdAt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all patients or search by name / phone
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search && search.trim() !== '') {
      const sanitizedSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitizedSearch, 'i');
      query = {
        $or: [{ name: searchRegex }, { phone: searchRegex }]
      };
    }

    const patients = await Patient.find(query)
      .sort({ createdAt: -1 })
      .select('_id name gender age phone createdAt');

    return successResponse(res, 200, 'Patients fetched', patients);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single patient by ID
// @route   GET /api/patients/:id
// @access  Private
const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findById(id).select('_id name gender age phone createdAt');

    if (!patient) {
      return errorResponse(res, 404, 'Patient not found');
    }

    return successResponse(res, 200, 'Patient fetched', patient);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById
};
