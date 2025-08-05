const SavedJob = require("../../models/jobs/savedJobsModel");
const Job = require("../../models/jobs/jobsmodel");
const mongoose = require("mongoose");

// Helper function to format job data for frontend display
const formatJobForCard = (savedJob) => {
  const job = savedJob.job;
  const currentDate = new Date();
  const applicationDeadline = new Date(job.applicationDeadline);
  const isExpired = applicationDeadline < currentDate;

  // Calculate days ago for posting date
  const daysAgo = Math.floor(
    (currentDate - new Date(job.createdAt)) / (1000 * 60 * 60 * 24)
  );

  // Format salary information
  let salaryInfo = "Salary: Competitive package";
  if (job.salaryMinimum && job.salaryMaximum) {
    salaryInfo = `Salary: ${
      job.salaryCurrency
    } ${job.salaryMinimum.toLocaleString()} - ${job.salaryMaximum.toLocaleString()}`;
  } else if (job.salaryMinimum) {
    salaryInfo = `Salary: ${
      job.salaryCurrency
    } ${job.salaryMinimum.toLocaleString()}+`;
  } else if (job.salaryMaximum) {
    salaryInfo = `Salary: Up to ${
      job.salaryCurrency
    } ${job.salaryMaximum.toLocaleString()}`;
  }

  // Format job type
  const jobType = job.contracts || "Full-time";

  // Format location
  const location = `${job.city}, ${job.country}`;

  // Truncate description for card display
  const description =
    job.description.length > 150
      ? job.description.substring(0, 150) + "..."
      : job.description;

  return {
    _id: savedJob._id,
    savedAt: savedJob.savedAt,
    job: {
      _id: job._id,
      jobTitle: job.jobTitle,
      organization: job.organization,
      location: location,
      description: description,
      salaryInfo: salaryInfo,
      jobType: jobType,
      daysAgo: daysAgo,
      applicationDeadline: job.applicationDeadline,
      isActive: job.isActive,
      isExpired: isExpired,
      status: isExpired
        ? "Applications for this position have closed"
        : "Active",
      // Additional fields for detailed view
      salaryMinimum: job.salaryMinimum,
      salaryMaximum: job.salaryMaximum,
      salaryCurrency: job.salaryCurrency,
      experience: job.experience,
      positions: job.positions,
      organizationTypes: job.organizationTypes,
      fullDescription: job.description,
    },
  };
};

// @desc    Save a job for later application
// @route   POST /api/jobs/save/:jobId
// @access  Private
const saveJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if job is already saved by this user
    const existingSavedJob = await SavedJob.findOne({
      userId,
      jobId,
    });

    if (existingSavedJob) {
      return res.status(400).json({
        success: false,
        message: "Job is already saved",
      });
    }

    // Save the job
    const savedJob = await SavedJob.create({
      userId,
      jobId,
    });

    res.status(201).json({
      success: true,
      message: "Job saved successfully",
      data: savedJob,
    });
  } catch (error) {
    console.error("Error saving job:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Unsave a job
// @route   DELETE /api/jobs/save/:jobId
// @access  Private
const unsaveJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId;

    // Find and delete the saved job
    const savedJob = await SavedJob.findOneAndDelete({
      userId,
      jobId,
    });

    if (!savedJob) {
      return res.status(404).json({
        success: false,
        message: "Saved job not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Job removed from saved jobs",
    });
  } catch (error) {
    console.error("Error unsaving job:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Get all saved jobs for a user
// @route   GET /api/jobs/saved
// @access  Private
const getSavedJobs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Get saved jobs with populated job details
    const savedJobs = await SavedJob.find({ userId })
      .populate({
        path: "job",
        select:
          "jobTitle organization country city contracts salaryMinimum salaryMaximum salaryCurrency experience applicationDeadline isActive description createdAt positions organizationTypes",
      })
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Format jobs for frontend display
    const formattedJobs = savedJobs.map(formatJobForCard);

    // Get total count for pagination
    const total = await SavedJob.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: formattedJobs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error getting saved jobs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Check if a job is saved by the user
// @route   GET /api/jobs/save/:jobId/check
// @access  Private
const checkIfJobSaved = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId;

    const savedJob = await SavedJob.findOne({
      userId,
      jobId,
    });

    res.status(200).json({
      success: true,
      isSaved: !!savedJob,
    });
  } catch (error) {
    console.error("Error checking if job is saved:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Get saved jobs count for a user
// @route   GET /api/jobs/saved/count
// @access  Private
const getSavedJobsCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const count = await SavedJob.countDocuments({ userId });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Error getting saved jobs count:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Get expired saved jobs for a user
// @route   GET /api/jobs/saved/expired
// @access  Private
const getExpiredSavedJobs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const currentDate = new Date();

    // Get saved jobs with populated job details and filter for expired jobs
    const expiredSavedJobs = await SavedJob.find({ userId })
      .populate({
        path: "job",
        select:
          "jobTitle organization country city contracts salaryMinimum salaryMaximum salaryCurrency experience applicationDeadline isActive description createdAt positions organizationTypes",
        match: {
          applicationDeadline: { $lt: currentDate }, // Jobs with deadline in the past
          isActive: true, // Only active jobs
        },
      })
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out saved jobs where the job doesn't exist or is not expired
    const validExpiredJobs = expiredSavedJobs.filter(
      (savedJob) =>
        savedJob.job && savedJob.job.applicationDeadline < currentDate
    );

    // Format expired jobs for frontend display
    const formattedExpiredJobs = validExpiredJobs.map(formatJobForCard);

    // Get total count of expired saved jobs for pagination
    const totalExpiredJobs = await SavedJob.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      {
        $unwind: "$job",
      },
      {
        $match: {
          "job.applicationDeadline": { $lt: currentDate },
          "job.isActive": true,
        },
      },
      {
        $count: "total",
      },
    ]);

    const total = totalExpiredJobs.length > 0 ? totalExpiredJobs[0].total : 0;

    res.status(200).json({
      success: true,
      data: formattedExpiredJobs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error getting expired saved jobs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Unsave all expired jobs for a user
// @route   DELETE /api/jobs/saved/expired
// @access  Private
const unsaveAllExpiredJobs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const currentDate = new Date();

    // Find all saved jobs for the user with expired application deadlines
    const expiredSavedJobs = await SavedJob.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      {
        $unwind: "$job",
      },
      {
        $match: {
          "job.applicationDeadline": { $lt: currentDate },
          "job.isActive": true,
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ]);

    if (expiredSavedJobs.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No expired saved jobs found",
        deletedCount: 0,
      });
    }

    // Extract the saved job IDs to delete
    const expiredSavedJobIds = expiredSavedJobs.map((job) => job._id);

    // Delete all expired saved jobs
    const deleteResult = await SavedJob.deleteMany({
      _id: { $in: expiredSavedJobIds },
    });

    res.status(200).json({
      success: true,
      message: `Successfully removed ${deleteResult.deletedCount} expired jobs from saved jobs`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Error unsaving expired jobs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Get count of expired saved jobs for a user
// @route   GET /api/jobs/saved/expired/count
// @access  Private
const getExpiredSavedJobsCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const currentDate = new Date();

    // Count expired saved jobs
    const expiredCount = await SavedJob.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      {
        $unwind: "$job",
      },
      {
        $match: {
          "job.applicationDeadline": { $lt: currentDate },
          "job.isActive": true,
        },
      },
      {
        $count: "total",
      },
    ]);

    const count = expiredCount.length > 0 ? expiredCount[0].total : 0;

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Error getting expired saved jobs count:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  saveJob,
  unsaveJob,
  getSavedJobs,
  checkIfJobSaved,
  getSavedJobsCount,
  getExpiredSavedJobs,
  unsaveAllExpiredJobs,
  getExpiredSavedJobsCount,
};
