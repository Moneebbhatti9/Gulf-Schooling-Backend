const Discussion = require("../../models/discussion/discussionModel");
const Reply = require("../../models/discussion/replyModel");

exports.createDiscussion = async (req, res) => {
  try {
    const { title, content, category } = req.body;

    const attachments = req.files?.map((file) => file.path); // Cloudinary URLs

    const newDiscussion = await Discussion.create({
      title,
      content,
      category,
      createdBy: req.user.userId,
      attachments,
    });

    res.status(201).json({ success: true, discussion: newDiscussion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.getDiscussionsByCategory = async (req, res) => {
  const { category } = req.params;

  try {
    const discussions = await Discussion.find({ tab: category })
      .populate("user", "name profilePicture") // adjust fields as needed
      .sort({ createdAt: -1 });

    res.status(200).json(discussions);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getSingleDiscussion = async (req, res) => {
  const { id } = req.params;

  try {
    const discussion = await Discussion.findById(id).populate("user", "name profilePicture");

    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    const replies = await Reply.find({ discussion: id })
      .populate("user", "name profilePicture")
      .sort({ createdAt: 1 });

    res.status(200).json({ discussion, replies });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};