const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discussion",
      required: true,
    },
    content: { type: String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reply", replySchema);
