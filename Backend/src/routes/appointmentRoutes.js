const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getTodayAppointments,
  getAppointments
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');

// All appointment routes are protected
router.use(protect);

// Specific named route declared before any wildcard/parameter routes
router.get('/today', getTodayAppointments);

router.route('/')
  .get(getAppointments)
  .post(createAppointment);

module.exports = router;
