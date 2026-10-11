const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const commonOptions = {
  timestamps: true,
  underscored: false
};

const trimSetter = (field) => ({
  set(value) {
    this.setDataValue(field, typeof value === 'string' ? value.trim() : value);
  }
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    ...trimSetter('name'),
    validate: {
      notNull: { msg: 'Name is required' },
      notEmpty: { msg: 'Name is required' }
    }
  },
  phone: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    ...trimSetter('phone'),
    validate: {
      notNull: { msg: 'Phone number is required' },
      notEmpty: { msg: 'Phone number is required' },
      is: { args: /^\d{10}$/, msg: 'Phone must be 10 digits' }
    }
  }
}, { ...commonOptions, tableName: 'users' });

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    ...trimSetter('name'),
    validate: {
      notNull: { msg: 'Patient name is required' },
      notEmpty: { msg: 'Patient name is required' }
    }
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: false,
    validate: {
      notNull: { msg: 'Gender is required' },
      isIn: { args: [['Male', 'Female', 'Other']], msg: 'Gender must be Male, Female, or Other' }
    }
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'Age is required' },
      min: { args: [0], msg: 'Age cannot be negative' },
      max: { args: [120], msg: 'Age cannot exceed 120' },
      isInt: { msg: 'Age must be a whole number' }
    }
  },
  phone: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    ...trimSetter('phone'),
    validate: {
      notNull: { msg: 'Phone number is required' },
      notEmpty: { msg: 'Phone number is required' },
      is: { args: /^\d{10}$/, msg: 'Phone must be 10 digits' }
    }
  }
}, { ...commonOptions, tableName: 'patients' });

const Doctor = sequelize.define('Doctor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    ...trimSetter('name'),
    validate: {
      notNull: { msg: 'Doctor name is required' },
      notEmpty: { msg: 'Doctor name is required' }
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    ...trimSetter('category'),
    validate: {
      notNull: { msg: 'Specialty category is required' },
      notEmpty: { msg: 'Specialty category is required' }
    }
  }
}, { ...commonOptions, tableName: 'doctors' });

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  appointmentDateTime: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notNull: { msg: 'Appointment date and time is required' },
      isDate: { msg: 'Invalid appointment date and time' }
    }
  },
  status: {
    type: DataTypes.ENUM('Scheduled', 'Completed'),
    allowNull: false,
    defaultValue: 'Scheduled',
    validate: {
      isIn: { args: [['Scheduled', 'Completed']], msg: 'Status must be either Scheduled or Completed' }
    }
  }
}, { ...commonOptions, tableName: 'appointments' });

const Consultation = sequelize.define('Consultation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  temperature: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { notNull: { msg: 'Temperature is required' }, isFloat: { msg: 'Temperature must be numeric' } }
  },
  pulse: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { notNull: { msg: 'Pulse is required' }, isInt: { msg: 'Pulse must be numeric' } }
  },
  notes: {
    type: DataTypes.STRING(500),
    allowNull: false,
    ...trimSetter('notes'),
    validate: {
      notNull: { msg: 'Consultation notes are required' },
      notEmpty: { msg: 'Consultation notes are required' },
      len: { args: [1, 500], msg: 'Notes cannot exceed 500 characters' }
    }
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  consultationDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, { ...commonOptions, tableName: 'consultations' });

Patient.hasMany(Appointment, { foreignKey: { name: 'patientId', allowNull: false }, onDelete: 'RESTRICT' });
Appointment.belongsTo(Patient, { as: 'patient', foreignKey: { name: 'patientId', allowNull: false } });

Doctor.hasMany(Appointment, { foreignKey: { name: 'doctorId', allowNull: false }, onDelete: 'RESTRICT' });
Appointment.belongsTo(Doctor, { as: 'doctor', foreignKey: { name: 'doctorId', allowNull: false } });

Appointment.hasOne(Consultation, { foreignKey: { name: 'appointmentId', allowNull: false }, onDelete: 'CASCADE' });
Consultation.belongsTo(Appointment, { as: 'appointment', foreignKey: { name: 'appointmentId', allowNull: false } });

module.exports = { sequelize, User, Patient, Doctor, Appointment, Consultation };
