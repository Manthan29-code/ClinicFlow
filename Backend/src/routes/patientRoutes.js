const express = require('express');
const router = express.Router();
const {
  createPatient,
  getPatients,
  getPatientById
} = require('../controllers/patientController');
const { getPatientConsultations } = require('../controllers/consultationController');
const { protect } = require('../middleware/auth');

// All patient routes are protected
router.use(protect);

router.route('/')
  .post(createPatient)
  .get(getPatients);

router.get('/:patientId/consultations', getPatientConsultations);
router.get('/:id', getPatientById);

module.exports = router;
