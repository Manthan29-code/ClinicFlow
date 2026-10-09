const mongoose = require('mongoose');
const Consultation = require('../models/Consultation');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const { successResponse, errorResponse } = require('../utils/response');

// Helper to populate consultation appointment and doctor
const populateConsultation = (query) => {
  return query
    .populate({
      path: 'appointment',
      select: '_id appointmentDateTime status doctor',
      populate: {
        path: 'doctor',
        select: '_id name category'
      }
    })
    .select('_id vitals notes isCompleted consultationDate appointment');
};

// @desc    Create / record vitals and notes for a consultation
// @route   POST /api/consultations
// @access  Private
const createConsultation = async (req, res, next) => {
  try {
    const { appointment, vitals, notes } = req.body;

    if (!appointment || !vitals || !notes) {
      return errorResponse(res, 400, 'Appointment ID, vitals, and notes are required');
    }

    if (!mongoose.Types.ObjectId.isValid(appointment)) {
      return errorResponse(res, 400, 'Invalid appointment ID format');
    }

    const targetAppointment = await Appointment.findById(appointment);
    if (!targetAppointment) {
      return errorResponse(res, 404, 'Appointment not found');
    }

    if (targetAppointment.status !== 'Scheduled') {
      return errorResponse(res, 409, 'Appointment already completed');
    }

    const existingConsultation = await Consultation.findOne({ appointment });
    if (existingConsultation) {
      return errorResponse(res, 409, 'Consultation already exists for this appointment');
    }

    const consultation = await Consultation.create({
      appointment,
      vitals: {
        temperature: Number(vitals.temperature),
        pulse: Number(vitals.pulse)
      },
      notes: notes.trim(),
      isCompleted: false
    });

    const populatedConsultation = await populateConsultation(Consultation.findById(consultation._id));

    return successResponse(res, 201, 'Consultation saved successfully', populatedConsultation);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a consultation as completed and update the appointment status
// @route   PATCH /api/consultations/:id/complete
// @access  Private
const completeConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, 'Invalid consultation ID format');
    }

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      return errorResponse(res, 404, 'Consultation not found');
    }

    if (consultation.isCompleted) {
      return errorResponse(res, 409, 'Consultation already completed');
    }

    // Step 1: Set consultation as completed
    consultation.isCompleted = true;
    await consultation.save();

    // Step 2: Update linked appointment status to Completed
    await Appointment.findByIdAndUpdate(consultation.appointment, {
      status: 'Completed'
    });

    const updatedConsultation = await populateConsultation(Consultation.findById(consultation._id));

    return successResponse(res, 200, 'Consultation completed successfully', updatedConsultation);
  } catch (error) {
    next(error);
  }
};

// @desc    Get completed consultation history for a specific patient
// @route   GET /api/patients/:patientId/consultations
// @access  Private
const getPatientConsultations = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return errorResponse(res, 400, 'Invalid patient ID format');
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return errorResponse(res, 404, 'Patient not found');
    }

    // Find all appointments for this patient
    const appointments = await Appointment.find({ patient: patientId }).select('_id');
    const appointmentIds = appointments.map((app) => app._id);

    // Find completed consultations for those appointments
    const consultations = await Consultation.find({
      appointment: { $in: appointmentIds },
      isCompleted: true
    })
      .populate({
        path: 'appointment',
        select: '_id appointmentDateTime status doctor',
        populate: {
          path: 'doctor',
          select: '_id name category'
        }
      })
      .sort({ consultationDate: -1, createdAt: -1 })
      .select('_id vitals notes isCompleted consultationDate appointment');

    return successResponse(res, 200, 'Patient consultation history fetched', consultations);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createConsultation,
  completeConsultation,
  getPatientConsultations
};
