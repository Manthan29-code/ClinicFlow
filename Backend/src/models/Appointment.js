const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required']
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor ID is required']
    },
    appointmentDateTime: {
      type: Date,
      required: [true, 'Appointment date and time is required']
    },
    status: {
      type: String,
      enum: {
        values: ['Scheduled', 'Completed'],
        message: 'Status must be either Scheduled or Completed'
      },
      default: 'Scheduled'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
