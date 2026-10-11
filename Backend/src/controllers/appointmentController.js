const { Appointment, Patient, Doctor } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { getTodayDateRange } = require('../utils/dateRange');
const { isValidId } = require('../utils/ids');

const appointmentIncludes = [
  { model: Patient, as: 'patient', attributes: ['id', 'name', 'phone'] },
  { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'category'] }
];

const createAppointment = async (req, res, next) => {
  try {
    const { patient, doctor, appointmentDateTime } = req.body;

    if (!patient || !doctor || !appointmentDateTime) {
      return errorResponse(res, 400, 'Patient, doctor, and appointment date/time are required');
    }
    if (!isValidId(patient) || !isValidId(doctor)) {
      return errorResponse(res, 400, 'Invalid ID format');
    }

    const patientExists = await Patient.findByPk(patient);
    if (!patientExists) return errorResponse(res, 404, 'Patient not found');

    const doctorExists = await Doctor.findByPk(doctor);
    if (!doctorExists) return errorResponse(res, 404, 'Doctor not found');

    const parsedDate = new Date(appointmentDateTime);
    if (Number.isNaN(parsedDate.getTime())) {
      return errorResponse(res, 400, 'Invalid appointment date and time');
    }

    const appointment = await Appointment.create({
      patientId: patient,
      doctorId: doctor,
      appointmentDateTime: parsedDate,
      status: 'Scheduled'
    });

    const populated = await Appointment.findByPk(appointment.id, {
      include: appointmentIncludes,
      attributes: ['id', 'appointmentDateTime', 'status']
    });

    return successResponse(res, 201, 'Appointment booked successfully', populated);
  } catch (error) {
    next(error);
  }
};

const getTodayAppointments = async (req, res, next) => {
  try {
    const { start, end } = getTodayDateRange();
    const appointments = await Appointment.findAll({
      where: { appointmentDateTime: { [require('sequelize').Op.between]: [start, end] } },
      include: appointmentIncludes,
      order: [['appointmentDateTime', 'ASC']],
      attributes: ['id', 'appointmentDateTime', 'status']
    });
    return successResponse(res, 200, "Today's appointments fetched", appointments);
  } catch (error) {
    next(error);
  }
};

const getAppointments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const appointments = await Appointment.findAll({
      where,
      include: appointmentIncludes,
      order: [['appointmentDateTime', 'ASC']],
      attributes: ['id', 'appointmentDateTime', 'status']
    });
    return successResponse(res, 200, 'Appointments fetched', appointments);
  } catch (error) {
    next(error);
  }
};

module.exports = { createAppointment, getTodayAppointments, getAppointments };
