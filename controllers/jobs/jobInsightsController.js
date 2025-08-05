const Job = require("../../models/jobs/jobsmodel");
const JobApplication = require("../../models/jobs/jobApplicationModel");
const AllUsers = require("../../models/Auth/allUsersModel");
const School = require("../../models/school/schoolmodel");

// Get job insights for admin (all jobs) or school (their jobs only)
const getJobInsights = async (req, res) => {
  try {
    const { role, userId } = req.user;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    let filter = { isActive: true };
    if (role === "school") {
      filter.createdBy = userId;
    }

    const jobs = await Job.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("createdBy", "fullName email role");

    const total = await Job.countDocuments(filter);

    const jobsWithInsights = await Promise.all(
      jobs.map(async (job) => {
        const jobObj = job.toObject();

        const applicationStats = await JobApplication.aggregate([
          { $match: { job: job._id } },
          {
            $group: {
              _id: null,
              totalApplications: { $sum: 1 },
              pendingApplications: {
                $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
              },
              shortlistedApplications: {
                $sum: { $cond: [{ $eq: ["$status", "shortlisted"] }, 1, 0] },
              },
              rejectedApplications: {
                $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
              },
            },
          },
        ]);

        let schoolInfo = null;
        if (jobObj.createdBy && jobObj.createdBy.role === "school") {
          const school = await School.findOne({ userId: jobObj.createdBy._id });
          if (school) {
            schoolInfo = {
              name: school.schoolName,
              logo:
                school.logo ||
                "https://img.freepik.com/premium-vector/school-building-illustration_1264005-10794.jpg",
              location: school.location,
            };
          }
        }

        return {
          ...jobObj,
          insights: applicationStats[0] || {
            totalApplications: 0,
            pendingApplications: 0,
            shortlistedApplications: 0,
            rejectedApplications: 0,
          },
          school: schoolInfo,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: jobsWithInsights.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: jobsWithInsights,
    });
  } catch (error) {
    console.error("getJobInsights error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Get detailed job insights with all applicants for a specific job
const getJobInsightDetails = async (req, res) => {
  try {
    const { role, userId } = req.user;
    const { jobId } = req.params;

    const job = await Job.findById(jobId).populate(
      "createdBy",
      "fullName email role"
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (role === "school" && job.createdBy._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view insights for your own jobs.",
      });
    }

    const applications = await JobApplication.find({ job: jobId })
      .populate("applicant", "fullName email profilePicture")
      .sort({ appliedAt: -1 });

    const applicationStats = await JobApplication.aggregate([
      { $match: { job: job._id } },
      {
        $group: {
          _id: null,
          totalApplications: { $sum: 1 },
          pendingApplications: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          shortlistedApplications: {
            $sum: { $cond: [{ $eq: ["$status", "shortlisted"] }, 1, 0] },
          },
          rejectedApplications: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
        },
      },
    ]);

    let schoolInfo = null;
    if (job.createdBy.role === "school") {
      const school = await School.findOne({ userId: job.createdBy._id });
      if (school) {
        schoolInfo = {
          name: school.schoolName,
          logo:
            school.logo ||
            "https://img.freepik.com/premium-vector/school-building-illustration_1264005-10794.jpg",
          location: school.location,
        };
      }
    }

    const jobWithInsights = {
      ...job.toObject(),
      insights: applicationStats[0] || {
        totalApplications: 0,
        pendingApplications: 0,
        shortlistedApplications: 0,
        rejectedApplications: 0,
      },
      applications: applications,
      school: schoolInfo,
    };

    res.status(200).json({
      success: true,
      data: jobWithInsights,
    });
  } catch (error) {
    console.error("getJobInsightDetails error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Get detailed applicant information for a specific application
const getApplicantDetails = async (req, res) => {
  try {
    const { role, userId } = req.user;
    const { applicationId } = req.params;

    const application = await JobApplication.findById(applicationId)
      .populate("applicant", "fullName email profilePicture")
      .populate({
        path: "job",
        select: "jobTitle organization createdBy",
        populate: {
          path: "createdBy",
          select: "fullName email role",
        },
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const isJobOwner =
      role === "school" && application.job.createdBy._id.toString() === userId;
    const isAdmin = role === "admin";

    if (!isJobOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only view applicants for your own jobs.",
      });
    }

    const applicantDetails = {
      application: application,
      teacherProfile: null, // Can be extended with teacher-specific details
    };

    res.status(200).json({
      success: true,
      data: applicantDetails,
    });
  } catch (error) {
    console.error("getApplicantDetails error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Update application status (for schools and admins)
const updateApplicationStatus = async (req, res) => {
  try {
    const { role, userId } = req.user;
    const { applicationId } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "shortlisted", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Must be one of: pending, shortlisted, rejected",
      });
    }

    const application = await JobApplication.findById(applicationId).populate({
      path: "job",
      select: "createdBy jobTitle",
      populate: {
        path: "createdBy",
        select: "fullName email role",
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const isJobOwner =
      role === "school" && application.job.createdBy._id.toString() === userId;
    const isAdmin = role === "admin";

    if (!isJobOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only update applications for your own jobs.",
      });
    }

    application.status = status;
    await application.save();

    const updatedApplication = await JobApplication.findById(applicationId)
      .populate("applicant", "fullName email profilePicture")
      .populate({
        path: "job",
        select: "jobTitle organization createdBy",
        populate: {
          path: "createdBy",
          select: "fullName email role",
        },
      });

    res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      data: updatedApplication,
    });
  } catch (error) {
    console.error("updateApplicationStatus error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Get job insights statistics
const getJobInsightsStats = async (req, res) => {
  try {
    const { role, userId } = req.user;

    let jobFilter = { isActive: true };
    if (role === "school") {
      jobFilter.createdBy = userId;
    }

    const jobStats = await Job.aggregate([
      { $match: jobFilter },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          activeJobs: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
          approvedJobs: {
            $sum: { $cond: [{ $eq: ["$isApproved", true] }, 1, 0] },
          },
          totalViews: { $sum: "$views" },
        },
      },
    ]);

    const applicationStats = await JobApplication.aggregate([
      {
        $lookup: {
          from: "jobs",
          localField: "job",
          foreignField: "_id",
          as: "jobDetails",
        },
      },
      { $unwind: "$jobDetails" },
      { $match: jobFilter },
      {
        $group: {
          _id: null,
          totalApplications: { $sum: 1 },
          pendingApplications: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          shortlistedApplications: {
            $sum: { $cond: [{ $eq: ["$status", "shortlisted"] }, 1, 0] },
          },
          rejectedApplications: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
        },
      },
    ]);

    const topJobs = await Job.aggregate([
      { $match: jobFilter },
      {
        $lookup: {
          from: "jobapplications",
          localField: "_id",
          foreignField: "job",
          as: "applications",
        },
      },
      {
        $addFields: {
          applicationCount: { $size: "$applications" },
        },
      },
      { $sort: { applicationCount: -1 } },
      { $limit: 5 },
      {
        $project: {
          jobTitle: 1,
          organization: 1,
          applicationCount: 1,
          views: 1,
        },
      },
    ]);

    const stats = {
      jobs: jobStats[0] || {
        totalJobs: 0,
        activeJobs: 0,
        approvedJobs: 0,
        totalViews: 0,
      },
      applications: applicationStats[0] || {
        totalApplications: 0,
        pendingApplications: 0,
        shortlistedApplications: 0,
        rejectedApplications: 0,
      },
      topJobs: topJobs,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("getJobInsightsStats error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  getJobInsights,
  getJobInsightDetails,
  getApplicantDetails,
  updateApplicationStatus,
  getJobInsightsStats,
};
