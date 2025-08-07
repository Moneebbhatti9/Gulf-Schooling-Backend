const UploadedCV = require("../../models/jobs/uploadedCVModel");

// Upload a new CV file
exports.uploadCV = async (req, res) => {
  try {
    // Only teachers can upload CVs
    if (req.user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Only teachers can upload CV files",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CV file is required",
      });
    }

    // Get file URL from multer-cloudinary
    const fileUrl = req.file.secure_url || req.file.path;
    if (!fileUrl) {
      return res.status(500).json({
        success: false,
        message: "Could not determine file URL",
      });
    }

    // Determine file type from original name
    const fileExtension = req.file.originalname.split(".").pop().toLowerCase();
    const validTypes = ["pdf", "doc", "docx"];

    if (!validTypes.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only PDF, DOC, and DOCX files are allowed",
      });
    }

    // Create uploaded CV record
    const uploadedCV = await UploadedCV.create({
      user: req.user.userId,
      fileName: req.file.originalname,
      fileUrl: fileUrl,
      fileSize: req.file.size,
      fileType: fileExtension,
      description: req.body.description || "",
    });

    res.status(201).json({
      success: true,
      message: "CV uploaded successfully",
      data: uploadedCV,
    });
  } catch (error) {
    console.error("Error uploading CV:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading CV file",
      error: error.message,
    });
  }
};

// Get all uploaded CVs for a user
exports.getUserCVs = async (req, res) => {
  try {
    // Only teachers can view their CVs
    if (req.user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Only teachers can view their CV files",
      });
    }

    const cvs = await UploadedCV.find({
      user: req.user.userId,
      isActive: true,
    }).sort({ uploadedAt: -1 });

    res.status(200).json({
      success: true,
      data: cvs,
    });
  } catch (error) {
    console.error("Error fetching CVs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching CV files",
      error: error.message,
    });
  }
};

// Delete an uploaded CV
exports.deleteCV = async (req, res) => {
  try {
    const { cvId } = req.params;

    // Only teachers can delete their CVs
    if (req.user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Only teachers can delete their CV files",
      });
    }

    const cv = await UploadedCV.findOne({
      _id: cvId,
      user: req.user.userId,
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: "CV file not found",
      });
    }

    // Soft delete by setting isActive to false
    cv.isActive = false;
    await cv.save();

    res.status(200).json({
      success: true,
      message: "CV file deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting CV:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting CV file",
      error: error.message,
    });
  }
};

// Update CV description
exports.updateCVDescription = async (req, res) => {
  try {
    const { cvId } = req.params;
    const { description } = req.body;

    // Only teachers can update their CVs
    if (req.user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Only teachers can update their CV files",
      });
    }

    const cv = await UploadedCV.findOne({
      _id: cvId,
      user: req.user.userId,
      isActive: true,
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: "CV file not found",
      });
    }

    cv.description = description;
    await cv.save();

    res.status(200).json({
      success: true,
      message: "CV description updated successfully",
      data: cv,
    });
  } catch (error) {
    console.error("Error updating CV description:", error);
    res.status(500).json({
      success: false,
      message: "Error updating CV description",
      error: error.message,
    });
  }
};
