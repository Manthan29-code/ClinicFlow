const express = require('express');
const router = express.Router();
const { getDoctors, createDoctor } = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');

// All doctor routes are protected
router.use(protect);

router.route('/')
  .get(getDoctors)
  .post(createDoctor);

module.exports = router;
