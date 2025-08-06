const Reply = require('../../models/discussion/replyModel');

const postReply = async (req, res) => {
  try {
    const { discussionId, body } = req.body;

    const reply = await Reply.create({
      discussion: discussionId,
      body,
      user: req.user._id,
    });

    // Emit socket event
    const io = req.app.get('io');
    io.emit('newReply', reply); // Optionally send discussionId with it

    res.status(201).json(reply);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


const getRepliesForTopic = async (req, res) => {
  try {
    const { topicId } = req.params;

    const replies = await Reply.find({ topic: topicId }).sort({ createdAt: 1 });
    res.status(200).json(replies);
  } catch (err) {
    console.error('Error fetching replies:', err);
    res.status(500).json({ error: 'Failed to get replies' });
  }
};

module.exports = {
  postReply,
  getRepliesForTopic,
};
