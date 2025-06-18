const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, markMessagesAsRead, getMilestoneStatus } = require('../controllers/messageController');
const { protect } = require('../midlleware/authMiddleware');

// All routes are protected
router.use(protect);

// Message operations
router.post('/', sendMessage);
router.get('/:matchId', getMessages);
router.put('/:matchId/read', markMessagesAsRead);
router.get('/:matchId/milestone', getMilestoneStatus);

module.exports = router;