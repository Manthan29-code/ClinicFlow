const { Op } = require('sequelize');
const { Patient } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { isValidId } = require('../utils/ids');

const createPatient = async (req, res, next) => {
  try {
    const { name, gender, age, phone } = req.body;
    const patient = await Patient.create({
      name: typeof name === 'string' ? name.trim() : name,
      gender,
      age: age === '' || age === null || age === undefined ? age : Number(age),
      phone: typeof phone === 'string' ? phone.trim() : phone
    });

    return successResponse(res, 201, 'Patient registered successfully', patient);
  } catch (error) {
    next(error);
  }
};

const getPatients = async (req, res, next) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const where = {};

    if (search) {
      const escaped = search.replace(/[\\%_]/g, '\\$&');
      const pattern = `%${escaped}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: pattern } },
        { phone: { [Op.iLike]: pattern } }
      ];
    }

    const patients = await Patient.findAll({
      where,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'gender', 'age', 'phone', 'createdAt']
    });

    return successResponse(res, 200, 'Patients fetched', patients);
  } catch (error) {
    next(error);
  }
};

const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return errorResponse(res, 400, 'Invalid ID');

    const patient = await Patient.findByPk(id, {
      attributes: ['id', 'name', 'gender', 'age', 'phone', 'createdAt']
    });

    if (!patient) return errorResponse(res, 404, 'Patient not found');
    return successResponse(res, 200, 'Patient fetched', patient);
  } catch (error) {
    next(error);
  }
};

module.exports = { createPatient, getPatients, getPatientById };
