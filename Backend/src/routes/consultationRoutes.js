const express = require('express');
const router = express.Router();
const {
  createConsultation,
  completeConsultation
} = require('../controllers/consultationController');
const { protect } = require('../middleware/auth');

// All consultation routes are protected
router.use(protect);

router.post('/', createConsultation);
router.patch('/:id/complete', completeConsultation);

module.exports = router;
