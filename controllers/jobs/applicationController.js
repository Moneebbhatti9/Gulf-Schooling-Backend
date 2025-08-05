const Job = require("../../models/jobs/jobsmodel");
const JobApplication = require("../../models/jobs/jobApplicationModel");

// controllers/jobs/applicationController.js

exports.applyToJob = async (req, res) => {
  try {
    // 1. Only teachers may apply
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ success: false, message: "Only teachers can apply." });
    }

    // 2. Fetch the job
    const jobId = req.params.id.trim();
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // 3. Ensure a resume file was uploaded
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Resume file is required" });
    }

    // 4. Get the URL out of req.file
    //    - multer-storage-cloudinary sets `secure_url` to the HTTPS link
    const resumeUrl = req.file.secure_url || req.file.path;
    if (!resumeUrl) {
      return res
        .status(500)
        .json({ success: false, message: "Could not determine resume URL" });
    }

    // 5. Parse screeningAnswers
    let screeningAnswers = [];
    try {
      screeningAnswers = JSON.parse(req.body.screeningAnswers);
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid JSON for screeningAnswers" });
    }

    let coverLetter = req.body.coverLetter || "";

    // 6. Create the application
    const application = await JobApplication.create({
      job: job._id,
      applicant: req.user.userId,
      resume: resumeUrl,
      screeningAnswers,
      coverLetter, // optional cover letter text
      // array of {question,answer}
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted",
      data: application,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// School/Admin views applications for a given job
exports.getApplicationsForJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // If school, ensure they own the job
    if (
      req.user.role === "school" &&
      job.createdBy.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Admin bypasses ownership check
    const applications = await JobApplication.find({ job: job._id })
      .populate("applicant", "fullName email")
      .sort({ appliedAt: -1 });

    res.status(200).json({ success: true, data: applications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all applications for the logged-in teacher
exports.getMyApplications = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Only teachers can view their applications.",
      });
    }

    const myApps = await JobApplication.find({ applicant: req.user.userId })
      .populate({
        path: "job",
        select: "jobTitle organization city country",
      })
      .sort({ appliedAt: -1 });

    res.status(200).json({ success: true, data: myApps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// Get all applications for the logged-in school

// Get a single job application by ID
exports.getApplicationById = async (req, res) => {
  try {
    const applicationId = req.params.id;

    // Find the application and populate related data
    const application = await JobApplication.findById(applicationId)
      .populate("applicant", "fullName email")
      .populate({
        path: "job",
        select: "jobTitle organization city country description requirements",
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Authorization checks
    const isApplicant =
      req.user.userId === application.applicant._id.toString();
    const isJobOwner =
      req.user.role === "school" &&
      application.job.createdBy.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";

    // Only the applicant, job owner (school), or admin can view the application
    if (!isApplicant && !isJobOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only view your own applications or applications for jobs you created.",
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update application status (schools only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["pending", "shortlisted", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Must be one of: pending, shortlisted, rejected",
      });
    }

    // Only schools can update application status
    if (req.user.role !== "school") {
      return res.status(403).json({
        success: false,
        message: "Only schools can update application status",
      });
    }

    // Find the application
    const application = await JobApplication.findById(applicationId).populate({
      path: "job",
      select: "createdBy jobTitle",
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if the school owns the job
    if (application.job.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update applications for jobs you created",
      });
    }

    // Update the status
    application.status = status;
    await application.save();

    // Return updated application with populated data
    const updatedApplication = await JobApplication.findById(applicationId)
      .populate("applicant", "fullName email")
      .populate({
        path: "job",
        select: "jobTitle organization city country description requirements",
      });

    res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      data: updatedApplication,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
