const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const { verifyToken } = require("../../middlewares/authMiddleware");
const cvManagementController = require("../../controllers/jobs/cvManagementController");
const uploadedCVController = require("../../controllers/jobs/uploadedCVController");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Multer-Storage-Cloudinary for CV files
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "cv-files",
    resource_type: "raw",
    allowed_formats: ["pdf", "doc", "docx"],
    public_id: (req, file) => `${Date.now()}-${req.user.userId}-cv`,
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, and DOCX files are allowed."
        ),
        false
      );
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// CV Management Routes
router.get("/options", cvManagementController.getCVOptions);
router.get("/status", cvManagementController.checkCVCreationStatus);
router.get("/platform-data", cvManagementController.getPlatformCVData);
router.get("/uploaded-data/:cvId", cvManagementController.getUploadedCVData);

// Uploaded CV Management Routes
router.post("/upload", upload.single("cvFile"), uploadedCVController.uploadCV);
router.get("/uploaded", uploadedCVController.getUserCVs);
router.delete("/uploaded/:cvId", uploadedCVController.deleteCV);
router.patch(
  "/uploaded/:cvId/description",
  uploadedCVController.updateCVDescription
);

module.exports = router;
