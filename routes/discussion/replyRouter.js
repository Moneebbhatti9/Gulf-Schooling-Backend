const express = require('express');
const router = express.Router();
const { verifyToken } = require("../../middlewares/authMiddleware");
const { postReply, getRepliesForTopic } = require('../../controllers/discussion/replyController');

router.post('/:topicId', verifyToken, postReply);
router.get('/:topicId', getRepliesForTopic);

module.exports = router;
