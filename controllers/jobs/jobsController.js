// ============================================
// controllers/jobController.js
const Job = require("../../models/jobs/jobsmodel");
const mongoose = require("mongoose");
const School = require("../../models/school/schoolmodel");
// const { escapeRegex, toCIRegexArray } = require("../../utils/helpers");

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public

const getJobs = async (req, res) => {
  try {
    const request = req.query;
    console.log("getJobs request:", request);

    // Helper function to clean and normalize input values
    const cleanValue = (value) => {
      if (typeof value === "string") {
        // Remove surrounding quotes and trim whitespace
        return value.replace(/^["']|["']$/g, "").trim();
      }
      return value;
    };

    // Helper function to create case-insensitive regex array for nested objects
    const toCIRegexArray = (arr) => {
      return arr.map((item) => ({
        $regex: cleanValue(item.toString()),
        $options: "i",
      }));
    };

    // Helper function to create case-insensitive regex for string fields
    const toCIRegexForStrings = (arr) => {
      return arr.map((item) => new RegExp(cleanValue(item.toString()), "i"));
    };

    // 1. Pagination & sorting
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // 2. Base filter
    const filter = { isActive: true };

    // 3. Text search with aggregation pipeline
    let useAggregation = false;
    let searchStage = null;

    if (req.query.search) {
      const term = cleanValue(req.query.search);
      console.log("Search term:", term);
      useAggregation = true;

      // Create search stage for aggregation
      searchStage = {
        $addFields: {
          searchScore: {
            $add: [
              // JobTitle match gets highest score
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$jobTitle",
                      regex: term,
                      options: "i",
                    },
                  },
                  10,
                  0,
                ],
              },
              // Organization match gets medium score
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$organization",
                      regex: term,
                      options: "i",
                    },
                  },
                  5,
                  0,
                ],
              },
              // Description match gets lowest score
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$description",
                      regex: term,
                      options: "i",
                    },
                  },
                  1,
                  0,
                ],
              },
            ],
          },
        },
      };
    }

    // 4. Location: Apply as AND condition (must match country OR city)
    if (req.query.location) {
      const loc = cleanValue(req.query.location);
      console.log("Location search term:", loc);

      // Create regex pattern for case-insensitive search
      const locRegex = { $regex: loc, $options: "i" };
      console.log("Location regex:", locRegex);

      // If we already have an $or condition (from search), we need to combine them
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or }, // search conditions
          {
            $or: [
              // location conditions
              { country: locRegex },
              { city: locRegex },
            ],
          },
        ];
        delete filter.$or;
      } else {
        filter.$or = [{ country: locRegex }, { city: locRegex }];
      }
    }

    // 5. Positions (array) - Handle as OR within positions
    if (req.query.positions) {
      const positions = Array.isArray(req.query.positions)
        ? req.query.positions
        : req.query.positions.split(",");

      const positionCondition = {
        $or: [
          { "positions.category": { $in: toCIRegexArray(positions) } },
          { "positions.subCategory": { $in: toCIRegexArray(positions) } },
        ],
      };

      // Add to existing $and array or create new one
      if (filter.$and) {
        filter.$and.push(positionCondition);
      } else if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, positionCondition];
        delete filter.$or;
      } else {
        filter.$or = positionCondition.$or;
      }
    }

    // 6. Organization types (array) - Handle as OR within org types
    if (req.query.organizationTypes) {
      const orgs = Array.isArray(req.query.organizationTypes)
        ? req.query.organizationTypes
        : req.query.organizationTypes.split(",");

      const orgCondition = {
        $or: [
          { "organizationTypes.category": { $in: toCIRegexArray(orgs) } },
          { "organizationTypes.subCategory": { $in: toCIRegexArray(orgs) } },
        ],
      };

      // Add to existing $and array or create new one
      if (filter.$and) {
        filter.$and.push(orgCondition);
      } else if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, orgCondition];
        delete filter.$or;
      } else {
        filter.$or = orgCondition.$or;
      }
    }

    // 7. Direct field matches (AND conditions) - FIXED for string fields
    if (req.query.subjects) {
      const subjects = Array.isArray(req.query.subjects)
        ? req.query.subjects
        : req.query.subjects.split(",");
      filter.subjects = { $in: toCIRegexForStrings(subjects) };
    }

    if (req.query.contracts) {
      const contracts = Array.isArray(req.query.contracts)
        ? req.query.contracts
        : req.query.contracts.split(",");
      filter.contracts = { $in: toCIRegexForStrings(contracts) };
    }

    if (req.query.experience) {
      const levels = Array.isArray(req.query.experience)
        ? req.query.experience
        : req.query.experience.split(",");
      filter.experience = { $in: toCIRegexForStrings(levels) };
    }

    if (req.query.educationLevels) {
      const ed = Array.isArray(req.query.educationLevels)
        ? req.query.educationLevels
        : req.query.educationLevels.split(",");
      filter.educationLevels = { $in: toCIRegexForStrings(ed) };
    }

    // 8. Salary range & currency
    if (req.query.salaryMin || req.query.salaryMax) {
      if (req.query.salaryMin)
        filter.salaryMinimum = { $gte: parseInt(req.query.salaryMin, 10) };
      if (req.query.salaryMax)
        filter.salaryMaximum = { $lte: parseInt(req.query.salaryMax, 10) };
    }
    if (req.query.salaryCurrency) {
      const cur = cleanValue(req.query.salaryCurrency);
      filter.salaryCurrency = { $regex: cur, $options: "i" };
    }

    // 9. Benefits (array) - FIXED for string field
    if (req.query.benefits) {
      const b = Array.isArray(req.query.benefits)
        ? req.query.benefits
        : req.query.benefits.split(",");
      filter.benefits = { $in: toCIRegexForStrings(b) };
    }

    // 10. Boolean flags
    if (req.query.visaSponsorship === "true") filter.visaSponsorship = true;
    if (req.query.quickApply === "true") filter.quickApply = true;
    if (req.query.salaryDisclosed === "true") filter.salaryDisclosed = true;

    // 11. Date filters
    const now = new Date();
    if (req.query.datePosted) {
      switch (req.query.datePosted) {
        case "today":
          filter.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
          break;
        case "week":
          filter.createdAt = {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          };
          break;
        case "month":
          filter.createdAt = {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          };
          break;
        case "3months":
          filter.createdAt = {
            $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          };
          break;
      }
    }
    if (req.query.applicationDeadline) {
      const d = req.query.applicationDeadline;
      if (d === "today") {
        filter.applicationDeadline = {
          $gte: new Date(now.setHours(0, 0, 0, 0)),
          $lt: new Date(now.setHours(23, 59, 59, 999)),
        };
      } else if (d === "week") {
        filter.applicationDeadline = {
          $gte: now,
          $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        };
      } else if (d === "month") {
        filter.applicationDeadline = {
          $gte: now,
          $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        };
      }
    }
    if (req.query.isNew === "true") filter.isNew = true;
    if (req.query.isExpirySoon === "true") filter.isExpirySoon = true;

    // 12. Approval & creator
    if (req.query.isApproved !== undefined) {
      filter.isApproved = req.query.isApproved === "true";
    }
    if (req.query.jobCreatedBy) {
      filter.jobCreatedBy = cleanValue(req.query.jobCreatedBy);
    }

    // 13. Geospatial distance
    if (req.query.latitude && req.query.longitude && req.query.distance) {
      const lat = parseFloat(req.query.latitude);
      const lng = parseFloat(req.query.longitude);
      const dist = parseInt(req.query.distance, 10) * 1000;
      filter.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: dist,
        },
      };
    }

    // // 14. Public/admin access
    // if (!req.user) {
    //   filter.isApproved          = true;
    //   filter.applicationDeadline = { $gt: new Date() };
    // } else if (req.user.role === "employer") {
    //   filter.createdBy = req.user._id;
    // }

    console.log("Final filter:", JSON.stringify(filter, null, 2));

    // --- Aggregations for facets ---
    const aggregatedCounts = await Job.aggregate([
      { $match: { isActive: true, isApproved: true } },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          contractTypes: { $addToSet: "$contracts" },
          subjects: { $addToSet: "$subjects" },
          organizationTypes: { $addToSet: "$organizationTypes.category" },
          countries: { $addToSet: "$country" },
          cities: { $addToSet: "$city" },
          experienceLevels: { $addToSet: "$experience" },
          educationLevels: { $addToSet: "$educationLevels" },
        },
      },
    ]);

    // --- Query jobs with aggregation if search, otherwise use find ---
    let jobs, total;

    if (useAggregation && searchStage) {
      // Build aggregation pipeline for search
      const pipeline = [
        { $match: filter },
        searchStage,
        {
          $match: {
            searchScore: { $gt: 0 },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdBy",
            pipeline: [{ $project: { name: 1, email: 1, role: 1 } }],
          },
        },
        {
          $unwind: {
            path: "$createdBy",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: { searchScore: -1, [sortBy]: sortOrder },
        },
      ];

      // Get total count for search results
      const countPipeline = [...pipeline, { $count: "total" }];
      const totalResult = await Job.aggregate(countPipeline);
      total = totalResult[0]?.total || 0;

      // Get paginated results
      const resultPipeline = [
        ...pipeline,
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ];

      jobs = await Job.aggregate(resultPipeline);
    } else {
      // Use regular find query
      [jobs, total] = await Promise.all([
        Job.find(filter)
          .sort({ [sortBy]: sortOrder })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("createdBy", "name email role"),
        Job.countDocuments(filter),
      ]);
    }

    // --- Attach school info ---
    const jobsWithSchool = await Promise.all(
      jobs.map(async (job) => {
        const obj = useAggregation ? job : job.toObject();
        if (obj.createdBy?._id) {
          const school = await School.findOne({ userId: obj.createdBy._id });
          if (school) {
            obj.school = {
              ...school.toObject(),
              logo: "https://img.freepik.com/premium-vector/school-building-illustration_1264005-10794.jpg",
            };
          }
        }
        return obj;
      })
    );

    // --- Fallback if no results ---
    if (total === 0) {
      const fallback = await Job.find({ isActive: true })
        .limit(5)
        .populate("createdBy", "name email role");
      return res.status(200).json({
        success: true,
        count: fallback.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        data: fallback,
        message: "No jobs found, showing latest active jobs.",
      });
    }

    // --- Final response ---
    return res.status(200).json({
      success: true,
      count: jobsWithSchool.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: jobsWithSchool,
      aggregations: aggregatedCounts[0] || {},
      debug:
        process.env.NODE_ENV === "development"
          ? { filter, query: req.query, useAggregation }
          : undefined,
    });
  } catch (error) {
    console.error("getJobs error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "createdBy",
      "name email role"
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Get school data for the job creator
    let jobWithSchoolData = job.toObject();

    if (jobWithSchoolData.createdBy && jobWithSchoolData.createdBy._id) {
      const school = await School.findOne({
        userId: jobWithSchoolData.createdBy._id,
      });

      if (school) {
        // Return the full school object instead of restructuring
        jobWithSchoolData.school = school.toObject();
        jobWithSchoolData.school.logo =
          "https://i.pinimg.com/736x/a2/f1/2b/a2f12b8fea345be7890c4f15f3c23aaf.jpg"; // Add debug flag for clarity
      }
    }

    // Increment view count
    job.views += 1;
    await job.save();

    res.status(200).json({
      success: true,
      data: jobWithSchoolData,
    });
  } catch (error) {
    console.error("getJob error:", error);

    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
// @desc    Create new job
// @route   POST /api/jobs
// @access  Private
const createJob = async (req, res) => {
  try {
    // Add user info to req.body
    req.body.createdBy = req.user.userId; // Using userId from your token structure

    // Set jobCreatedBy based on user role (you might need to fetch user from DB to get role)
    // For now, defaulting to 'school' - you can modify this logic based on your needs
    if (!req.body.jobCreatedBy) {
      req.body.jobCreatedBy = "school"; // Default value
    }

    const job = await Job.create(req.body);

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors,
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private
const updateJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user owns the job or is admin
    if (
      job.createdBy.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this job",
      });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: job,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors,
      });
    }
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user owns the job or is admin
    if (
      job.createdBy.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this job",
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Approve/Disapprove job (Admin only)
// @route   PATCH /api/jobs/:id/approve
// @access  Private (Admin)
const approveJob = async (req, res) => {
  try {
    const { isApproved } = req.body;

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Job ${isApproved ? "approved" : "disapproved"} successfully`,
      data: job,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Get jobs stats
// @route   GET /api/jobs/stats
// @access  Private (Admin)
const getJobStats = async (req, res) => {
  try {
    const stats = await Job.aggregate([
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          approvedJobs: {
            $sum: { $cond: [{ $eq: ["$isApproved", true] }, 1, 0] },
          },
          pendingJobs: {
            $sum: { $cond: [{ $eq: ["$isApproved", false] }, 1, 0] },
          },
          activeJobs: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          totalViews: { $sum: "$views" },
          totalApplications: { $sum: "$applicationsCount" },
        },
      },
    ]);

    const contractStats = await Job.aggregate([
      { $group: { _id: "$contracts", count: { $sum: 1 } } },
    ]);

    const experienceStats = await Job.aggregate([
      { $group: { _id: "$experience", count: { $sum: 1 } } },
    ]);

    const creatorStats = await Job.aggregate([
      { $group: { _id: "$jobCreatedBy", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {},
        contractDistribution: contractStats,
        experienceDistribution: experienceStats,
        creatorDistribution: creatorStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  approveJob,
  getJobStats,
};

// ============================================
