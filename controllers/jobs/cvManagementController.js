const CV = require("../../models/teacher/teacherCVModel");
const UploadedCV = require("../../models/jobs/uploadedCVModel");
const Teacher = require("../../models/teacher/teacherModel");

// Get CV options for job application
exports.getCVOptions = async (req, res) => {
  try {
    // Only teachers can access CV options
    if (req.user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Only teachers can access CV options",
      });
    }

    const userId = req.user.userId;

    // Get teacher profile
    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      });
    }

    // Get platform CV
    const platformCV = await CV.findOne({ teacher: teacher._id });

    // Get uploaded CVs
    const uploadedCVs = await UploadedCV.find({
      user: userId,
      isActive: true,
    }).sort({ uploadedAt: -1 });

    const options = {
      hasPlatformCV: !!platformCV,
      platformCV: platformCV
        ? {
            id: platformCV._id,
            completionPercentage: platformCV.completionPercentage,
            isComplete: platformCV.isComplete,
            lastUpdated: platformCV.lastUpdated,
          }
        : null,
      uploadedCVs: uploadedCVs.map((cv) => ({
        id: cv._id,
        fileName: cv.fileName,
        fileType: cv.fileType,
        fileSize: cv.fileSize,
        uploadedAt: cv.uploadedAt,
        description: cv.description,
      })),
      totalUploadedCVs: uploadedCVs.length,
    };

    res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error("Error getting CV options:", error);
    res.status(500).json({
      success: false,
      message: "Error getting CV options",
      error: error.message,
    });
  }
};

// Check CV creation status
exports.checkCVCreationStatus = async (req, res) => {
  try {
    // Only teachers can check CV status
    if (req.user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Only teachers can check CV status",
      });
    }

    const userId = req.user.userId;

    // Get teacher profile
    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      });
    }

    // Get platform CV
    const platformCV = await CV.findOne({ teacher: teacher._id });

    if (!platformCV) {
      return res.status(200).json({
        success: true,
        data: {
          hasCV: false,
          message: "No platform CV found",
        },
      });
    }

    const completionPercentage = platformCV.calculateCompletionPercentage();

    res.status(200).json({
      success: true,
      data: {
        hasCV: true,
        completionPercentage,
        isComplete: platformCV.isComplete,
        lastUpdated: platformCV.lastUpdated,
        missingSections: platformCV.getMissingSections(),
      },
    });
  } catch (error) {
    console.error("Error checking CV status:", error);
    res.status(500).json({
      success: false,
      message: "Error checking CV status",
      error: error.message,
    });
  }
};

// Get CV data for application (platform CV)
exports.getPlatformCVData = async (req, res) => {
  try {
    // Only teachers can access their CV data
    if (req.user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Only teachers can access their CV data",
      });
    }

    const userId = req.user.userId;

    // Get teacher profile
    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      });
    }

    // Get platform CV
    const platformCV = await CV.findOne({ teacher: teacher._id });
    if (!platformCV) {
      return res.status(404).json({
        success: false,
        message: "Platform CV not found",
      });
    }

    // Check if CV is complete enough for application
    const completionPercentage = platformCV.calculateCompletionPercentage();
    if (completionPercentage < 50) {
      return res.status(400).json({
        success: false,
        message:
          "CV is not complete enough for application. Please complete your CV first.",
        data: {
          completionPercentage,
          missingSections: platformCV.getMissingSections(),
        },
      });
    }

    res.status(200).json({
      success: true,
      data: platformCV,
    });
  } catch (error) {
    console.error("Error getting CV data:", error);
    res.status(500).json({
      success: false,
      message: "Error getting CV data",
      error: error.message,
    });
  }
};

// Get uploaded CV data for application
exports.getUploadedCVData = async (req, res) => {
  try {
    const { cvId } = req.params;

    // Only teachers can access their CV data
    if (req.user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Only teachers can access their CV data",
      });
    }

    const uploadedCV = await UploadedCV.findOne({
      _id: cvId,
      user: req.user.userId,
      isActive: true,
    });

    if (!uploadedCV) {
      return res.status(404).json({
        success: false,
        message: "Uploaded CV not found",
      });
    }

    res.status(200).json({
      success: true,
      data: uploadedCV,
    });
  } catch (error) {
    console.error("Error getting uploaded CV data:", error);
    res.status(500).json({
      success: false,
      message: "Error getting uploaded CV data",
      error: error.message,
    });
  }
};
