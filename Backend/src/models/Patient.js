const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: {
        values: ['Male', 'Female', 'Other'],
        message: 'Gender must be Male, Female, or Other'
      }
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [120, 'Age cannot exceed 120']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^\d{10}$/, 'Phone must be 10 digits']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Patient', patientSchema);
