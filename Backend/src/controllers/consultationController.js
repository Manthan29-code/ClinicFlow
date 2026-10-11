const { sequelize, Consultation, Appointment, Patient, Doctor } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { formatConsultation } = require('../utils/formatConsultation');
const { isValidId } = require('../utils/ids');

const consultationIncludes = [{
  model: Appointment,
  as: 'appointment',
  attributes: ['id', 'appointmentDateTime', 'status', 'doctorId'],
  include: [{
    model: Doctor,
    as: 'doctor',
    attributes: ['id', 'name', 'category']
  }]
}];

const createConsultation = async (req, res, next) => {
  try {
    const { appointment, vitals, notes } = req.body;

    if (!appointment || !vitals || typeof vitals !== 'object' || vitals.temperature === undefined ||
        vitals.pulse === undefined || typeof notes !== 'string' || !notes.trim()) {
      return errorResponse(res, 400, 'Appointment ID, vitals, and notes are required');
    }
    if (!isValidId(appointment)) return errorResponse(res, 400, 'Invalid appointment ID format');

    const targetAppointment = await Appointment.findByPk(appointment);
    if (!targetAppointment) return errorResponse(res, 404, 'Appointment not found');
    if (targetAppointment.status !== 'Scheduled') {
      return errorResponse(res, 409, 'Appointment already completed');
    }

    const existingConsultation = await Consultation.findOne({ where: { appointmentId: appointment } });
    if (existingConsultation) {
      return errorResponse(res, 409, 'Consultation already exists for this appointment');
    }

    const consultation = await Consultation.create({
      appointmentId: appointment,
      temperature: Number(vitals.temperature),
      pulse: Number(vitals.pulse),
      notes: notes.trim(),
      isCompleted: false
    });

    const populated = await Consultation.findByPk(consultation.id, { include: consultationIncludes });
    return successResponse(res, 201, 'Consultation saved successfully', formatConsultation(populated));
  } catch (error) {
    next(error);
  }
};

const completeConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return errorResponse(res, 400, 'Invalid consultation ID format');

    const updatedId = await sequelize.transaction(async (transaction) => {
      const consultation = await Consultation.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!consultation) {
        const error = new Error('Consultation not found');
        error.statusCode = 404;
        throw error;
      }
      if (consultation.isCompleted) {
        const error = new Error('Consultation already completed');
        error.statusCode = 409;
        throw error;
      }

      consultation.isCompleted = true;
      await consultation.save({ transaction });

      await Appointment.update(
        { status: 'Completed' },
        { where: { id: consultation.appointmentId }, transaction }
      );

      return consultation.id;
    });

    const updated = await Consultation.findByPk(updatedId, { include: consultationIncludes });
    return successResponse(res, 200, 'Consultation completed successfully', formatConsultation(updated));
  } catch (error) {
    next(error);
  }
};

const getPatientConsultations = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    if (!isValidId(patientId)) return errorResponse(res, 400, 'Invalid patient ID format');

    const patient = await Patient.findByPk(patientId);
    if (!patient) return errorResponse(res, 404, 'Patient not found');

    const consultations = await Consultation.findAll({
      where: { isCompleted: true },
      include: [{
        model: Appointment,
        as: 'appointment',
        where: { patientId },
        required: true,
        attributes: ['id', 'appointmentDateTime', 'status', 'doctorId'],
        include: [{
          model: Doctor,
          as: 'doctor',
          attributes: ['id', 'name', 'category']
        }]
      }],
      order: [['consultationDate', 'DESC'], ['createdAt', 'DESC']]
    });

    return successResponse(res, 200, 'Patient consultation history fetched', consultations.map(formatConsultation));
  } catch (error) {
    next(error);
  }
};

module.exports = { createConsultation, completeConsultation, getPatientConsultations };
