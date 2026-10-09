const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment ID is required'],
      unique: true
    },
    vitals: {
      temperature: {
        type: Number,
        required: [true, 'Temperature is required']
      },
      pulse: {
        type: Number,
        required: [true, 'Pulse is required']
      }
    },
    notes: {
      type: String,
      required: [true, 'Consultation notes are required'],
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    consultationDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Consultation', consultationSchema);
