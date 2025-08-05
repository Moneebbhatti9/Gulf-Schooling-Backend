const CV = require("../../models/teacher/teacherCVModel");
const Teacher = require("../../models/teacher/teacherModel");

// Helper function to check CV ownership
const checkCVOwnership = async (cvId, userId, userRole) => {
  const cv = await CV.findById(cvId).populate('teacher');
  
  if (!cv) {
    return { authorized: false, error: "CV not found" };
  }
  
  // Admin can access any CV
  if (userRole === 'admin') {
    return { authorized: true, cv };
  }
  
  // Check if user owns this CV through teacher
  if (cv.teacher && cv.teacher.userId.toString() === userId) {
    return { authorized: true, cv };
  }
  
  return { authorized: false, error: "Access denied" };
};

// Create CV - SECURED
exports.createCV = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    // Find teacher by userId (current user must be a teacher)
    const teacher = await Teacher.findOne({ userId });
    if (!teacher) {
      return res.status(403).json({
        success: false,
        message: "Only teachers can create CVs",
      });
    }
    
    // Check if CV already exists for this teacher
    const existingCV = await CV.findOne({ teacher: teacher._id });
    if (existingCV) {
      return res.status(400).json({
        success: false,
        message: "CV already exists for this teacher",
      });
    }
    
    // Create new CV
    const cvData = {
      teacher: teacher._id,
      userId: userId,
      email: req.body.email || "",
      basicInformation: {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        gender: teacher.gender,
      },
      teacherQualifications: teacher.PGCE === "Yes" ? [{
        qualification: "PGCE",
        qualificationSubject: teacher.subjectExpertise,
      }] : [],
      ...req.body,
    };
    
    const cv = await CV.create(cvData);
    cv.calculateCompletionPercentage();
    await cv.save();
    await cv.populate('teacher');
    
    res.status(201).json({
      success: true,
      message: "CV created successfully",
      data: cv,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating CV",
      error: error.message,
    });
  }
};

// Get My CVs - SECURED
exports.getMyCVs = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const cv = await CV.findOne({ userId }).populate('teacher');
    
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: "No CV found for this user",
      });
    }
    
    res.status(200).json({
      success: true,
      data: cv,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching CV",
      error: error.message,
    });
  }
};

// Get CV by ID - SECURED
exports.getCVById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    const { authorized, cv, error } = await checkCVOwnership(id, userId, userRole);
    
    if (!authorized) {
      return res.status(error === "CV not found" ? 404 : 403).json({
        success: false,
        message: error,
      });
    }
    
    res.status(200).json({
      success: true,
      data: cv,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching CV",
      error: error.message,
    });
  }
};

// Get CV by Teacher ID - SECURED
exports.getCVByTeacherId = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    const cv = await CV.findOne({ teacher: teacherId }).populate('teacher');
    
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: "CV not found for this teacher",
      });
    }
    
    // Check authorization
    if (userRole !== 'admin' && cv.teacher.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
    
    res.status(200).json({
      success: true,
      data: cv,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching CV",
      error: error.message,
    });
  }
};

// Get all CVs - ADMIN ONLY
exports.getAllCVs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      isComplete,
      search,
      sortBy = 'lastUpdated',
      order = 'desc'
    } = req.query;
    
    const query = {};
    
    if (isComplete !== undefined) {
      query.isComplete = isComplete === 'true';
    }
    
    if (search) {
      query.$or = [
        { 'welcomeStatement': { $regex: search, $options: 'i' } },
        { 'email': { $regex: search, $options: 'i' } },
        { 'basicInformation.firstName': { $regex: search, $options: 'i' } },
        { 'basicInformation.lastName': { $regex: search, $options: 'i' } },
      ];
    }
    
    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;
    
    const cvs = await CV.find(query)
      .populate('teacher')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await CV.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: cvs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching CVs",
      error: error.message,
    });
  }
};

// Update CV - SECURED
exports.updateCV = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    const { authorized, cv, error } = await checkCVOwnership(id, userId, userRole);
    
    if (!authorized) {
      return res.status(error === "CV not found" ? 404 : 403).json({
        success: false,
        message: error,
      });
    }
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      cv[key] = req.body[key];
    });
    
    cv.calculateCompletionPercentage();
    await cv.save();
    await cv.populate('teacher');
    
    res.status(200).json({
      success: true,
      message: "CV updated successfully",
      data: cv,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating CV",
      error: error.message,
    });
  }
};

// Update CV Section - SECURED
exports.updateCVSection = async (req, res) => {
  try {
    const { id, section } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    const allowedSections = [
      'welcomeStatement',
      'basicInformation',
      'languagesSpoken',
      'employmentHistory',
      'teacherQualifications',
      'continuingProfessionalDevelopment',
      'membershipOfProfessionalBodies',
      'educationalBackground',
      'entrepreneurship',
      'referees',
      'additionalSections',
      'inputOpportunitiesInformation',
    ];
    
    if (!allowedSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: "Invalid section",
      });
    }
    
    const { authorized, cv, error } = await checkCVOwnership(id, userId, userRole);
    
    if (!authorized) {
      return res.status(error === "CV not found" ? 404 : 403).json({
        success: false,
        message: error,
      });
    }
    
    cv[section] = req.body[section];
    cv.calculateCompletionPercentage();
    await cv.save();
    await cv.populate('teacher');
    
    res.status(200).json({
      success: true,
      message: `${section} updated successfully`,
      data: cv,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating CV section",
      error: error.message,
    });
  }
};

// Delete CV - SECURED
exports.deleteCV = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    const { authorized, error } = await checkCVOwnership(id, userId, userRole);
    
    if (!authorized) {
      return res.status(error === "CV not found" ? 404 : 403).json({
        success: false,
        message: error,
      });
    }
    
    await CV.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: "CV deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting CV",
      error: error.message,
    });
  }
};

// Update Welcome Statement - SECURED
exports.updateWelcomeStatement = async (req, res) => {
  try {
    const { id } = req.params;
    const { welcomeStatement } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    const { authorized, cv, error } = await checkCVOwnership(id, userId, userRole);
    
    if (!authorized) {
      return res.status(error === "CV not found" ? 404 : 403).json({
        success: false,
        message: error,
      });
    }
    
    cv.welcomeStatement = welcomeStatement;
    cv.calculateCompletionPercentage();
    await cv.save();
    await cv.populate('teacher');
    
    res.status(200).json({
      success: true,
      message: "Welcome statement updated successfully",
      data: cv,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating welcome statement",
      error: error.message,
    });
  }
};

// Add Employment History - SECURED
exports.addEmploymentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    const { authorized, cv, error } = await checkCVOwnership(id, userId, userRole);
    
    if (!authorized) {
      return res.status(error === "CV not found" ? 404 : 403).json({
        success: false,
        message: error,
      });
    }
    
    cv.employmentHistory.push(req.body);
    cv.calculateCompletionPercentage();
    await cv.save();
    await cv.populate('teacher');
    
    res.status(200).json({
      success: true,
      message: "Employment history added successfully",
      data: cv,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding employment history",
      error: error.message,
    });
  }
};

// Remove Employment History - SECURED
exports.removeEmploymentHistory = async (req, res) => {
  try {
    const { id, entryId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    const { authorized, cv, error } = await checkCVOwnership(id, userId, userRole);
    
    if (!authorized) {
      return res.status(error === "CV not found" ? 404 : 403).json({
        success: false,
        message: error,
      });
    }
    
    cv.employmentHistory = cv.employmentHistory.filter(
      entry => entry._id.toString() !== entryId
    );
    cv.calculateCompletionPercentage();
    await cv.save();
    await cv.populate('teacher');
    
    res.status(200).json({
      success: true,
      message: "Employment history removed successfully",
      data: cv,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error removing employment history",
      error: error.message,
    });
  }
};

// Add Language - SECURED
exports.addLanguage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    const { authorized, cv, error } = await checkCVOwnership(id, userId, userRole);
    
    if (!authorized) {
      return res.status(error === "CV not found" ? 404 : 403).json({
        success: false,
        message: error,
      });
    }
    
    cv.languagesSpoken.push(req.body);
    cv.calculateCompletionPercentage();
    await cv.save();
    await cv.populate('teacher');
    
    res.status(200).json({
      success: true,
      message: "Language added successfully",
      data: cv,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding language",
      error: error.message,
    });
  }
};

// Remove Language - SECURED
exports.removeLanguage = async (req, res) => {
  try {
    const { id, languageId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    const { authorized, cv, error } = await checkCVOwnership(id, userId, userRole);
    
    if (!authorized) {
      return res.status(error === "CV not found" ? 404 : 403).json({
        success: false,
        message: error,
      });
    }
    
    cv.languagesSpoken = cv.languagesSpoken.filter(
      lang => lang._id.toString() !== languageId
    );
    cv.calculateCompletionPercentage();
    await cv.save();
    await cv.populate('teacher');
    
    res.status(200).json({
      success: true,
      message: "Language removed successfully",
      data: cv,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error removing language",
      error: error.message,
    });
  }
};

// Get CV Completion Status - SECURED
exports.getCVCompletionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    const { authorized, cv, error } = await checkCVOwnership(id, userId, userRole);
    
    if (!authorized) {
      return res.status(error === "CV not found" ? 404 : 403).json({
        success: false,
        message: error,
      });
    }
    
    const completionPercentage = cv.calculateCompletionPercentage();
    
    res.status(200).json({
      success: true,
      data: {
        completionPercentage,
        isComplete: cv.isComplete,
        missingFields: cv.getMissingSections(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting completion status",
      error: error.message,
    });
  }
};

// ADMIN ONLY METHODS

// Approve CV for Public Viewing
exports.approveCVForPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;
    
    const cv = await CV.findByIdAndUpdate(
      id,
      { isPublic: isApproved },
      { new: true }
    ).populate('teacher');
    
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: "CV not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: `CV ${isApproved ? 'approved for' : 'removed from'} public viewing`,
      data: cv,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating CV approval status",
      error: error.message,
    });
  }
};

// Feature CV
exports.featureCV = async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    
    const cv = await CV.findByIdAndUpdate(
      id,
      { featured: featured },
      { new: true }
    ).populate('teacher');
    
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: "CV not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: `CV ${featured ? 'featured' : 'unfeatured'} successfully`,
      data: cv,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating CV feature status",
      error: error.message,
    });
  }
};

// Get CV Statistics
exports.getCVStats = async (req, res) => {
  try {
    const stats = await CV.aggregate([
      {
        $group: {
          _id: null,
          totalCVs: { $sum: 1 },
          completeCVs: { $sum: { $cond: ["$isComplete", 1, 0] } },
          publicCVs: { $sum: { $cond: ["$isPublic", 1, 0] } },
          averageCompletion: { $avg: "$completionPercentage" },
          totalViews: { $sum: "$viewCount" },
          totalDownloads: { $sum: "$downloadCount" },
        },
      },
    ]);
    
    res.status(200).json({
      success: true,
      data: stats[0] || {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching CV statistics",
      error: error.message,
    });
  }
};