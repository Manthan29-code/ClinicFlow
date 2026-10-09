const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { successResponse, errorResponse } = require('../utils/response');
const { getTodayDateRange } = require('../utils/dateRange');

// Helper to populate patient and doctor fields consistently
const populateAppointment = (query) => {
  return query
    .populate('patient', '_id name phone')
    .populate('doctor', '_id name category');
};

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res, next) => {
  try {
    const { patient, doctor, appointmentDateTime } = req.body;

    if (!patient || !doctor || !appointmentDateTime) {
      return errorResponse(res, 400, 'Patient, doctor, and appointment date/time are required');
    }

    if (!mongoose.Types.ObjectId.isValid(patient)) {
      return errorResponse(res, 400, 'Invalid patient ID format');
    }

    if (!mongoose.Types.ObjectId.isValid(doctor)) {
      return errorResponse(res, 400, 'Invalid doctor ID format');
    }

    const patientExists = await Patient.findById(patient);
    if (!patientExists) {
      return errorResponse(res, 404, 'Patient not found');
    }

    const doctorExists = await Doctor.findById(doctor);
    if (!doctorExists) {
      return errorResponse(res, 404, 'Doctor not found');
    }

    const parsedDate = new Date(appointmentDateTime);
    if (isNaN(parsedDate.getTime())) {
      return errorResponse(res, 400, 'Invalid appointment date and time');
    }

    const newAppointment = await Appointment.create({
      patient,
      doctor,
      appointmentDateTime: parsedDate,
      status: 'Scheduled'
    });

    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate('patient', '_id name phone')
      .populate('doctor', '_id name category')
      .select('_id patient doctor appointmentDateTime status');

    return successResponse(res, 201, 'Appointment booked successfully', populatedAppointment);
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's appointments sorted by time ascending
// @route   GET /api/appointments/today
// @access  Private
const getTodayAppointments = async (req, res, next) => {
  try {
    const { start, end } = getTodayDateRange();

    const appointments = await Appointment.find({
      appointmentDateTime: {
        $gte: start,
        $lte: end
      }
    })
      .populate('patient', '_id name phone')
      .populate('doctor', '_id name category')
      .sort({ appointmentDateTime: 1 })
      .select('_id patient doctor appointmentDateTime status');

    return successResponse(res, 200, "Today's appointments fetched", appointments);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all appointments (optionally filter by status)
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', '_id name phone')
      .populate('doctor', '_id name category')
      .sort({ appointmentDateTime: 1 })
      .select('_id patient doctor appointmentDateTime status');

    return successResponse(res, 200, 'Appointments fetched', appointments);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  getTodayAppointments,
  getAppointments
};
