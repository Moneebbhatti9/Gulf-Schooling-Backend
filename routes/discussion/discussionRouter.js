const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const { verifyToken } = require("../../middlewares/authMiddleware");

const {
  createDiscussion,
  getDiscussionsByCategory,
  getSingleDiscussion,
} = require("../../controllers/discussion/discussionController");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- Multer Cloudinary Storage Setup ---
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "discussion_attachments", // different folder to organize better
    resource_type: "image", // image files
    format: async (req, file) => file.mimetype.split("/")[1], // jpg/png/etc
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

const upload = multer({ storage });
router.post("/", verifyToken, upload.array("attachments", 5), createDiscussion);
router.get("/category/:category", getDiscussionsByCategory);
router.get("/:id", getSingleDiscussion);

module.exports = router;
