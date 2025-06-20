const express = require('express');
const router = express.Router();
const { getDailyMatch, pinMatch, unpinMatch, getMatchDetails } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// Get daily match
router.get('/daily', getDailyMatch);

// Match operations
router.get('/:id', getMatchDetails);
router.put('/:id/pin', pinMatch);
router.put('/:id/unpin', unpinMatch);

module.exports = router;