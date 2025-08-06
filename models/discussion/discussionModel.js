const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String }, // optional or required depending on design
  category: {
    type: String,
    enum: ["School Management", "Teacher Development", "Student Activities"],
    required: true
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attachments: [{ type: String }], // cloudinary URLs
}, { timestamps: true });

module.exports = mongoose.model('Discussion', discussionSchema);
