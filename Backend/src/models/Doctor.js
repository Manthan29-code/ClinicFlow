const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Specialty category is required'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Doctor', doctorSchema);
