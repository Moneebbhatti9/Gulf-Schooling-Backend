const School = require("../../models/school/schoolmodel");
const AllUsers = require("../../models/Auth/allUsersModel");

// Create a new school
exports.createSchool = async (req, res) => {
  try {
    const { userId } = req.body;

    // Check if a school with the same userId already exists

    const existingSchool = await School.findOne({ userId });
    if (existingSchool) {
      return res
        .status(400)
        .json({ message: "School with this userId already exists" });
    }

    const school = new School(req.body);
    await school.save();

    const user = await AllUsers.findByIdAndUpdate(
      userId,
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(201).json(school);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all schools
exports.getAllSchools = async (req, res) => {
  try {
    const schools = await School.find().populate("userId");
    res.status(200).json(schools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single school by ID
exports.getSchoolById = async (req, res) => {
  console.log("userId:", req.params.id)
  try {
    const school = await School.findOne({ userId: req.params.id });

    if (!school) {
      return res.status(404).json({ message: "School not found for this userId" });
    }

    res.status(200).json(school);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a school by ID
exports.updateSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!school) return res.status(404).json({ message: "School not found" });
    res.status(200).json(school);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a school by ID
exports.deleteSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);
    if (!school) return res.status(404).json({ message: "School not found" });
    res.status(200).json({ message: "School deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.verifySchool = async (req, res) => {
    try {
        const school = await School.findByIdAndUpdate(
            req.params.id,
            { isAdminVerified: true },
            { new: true }
        );

        if (!school) {
            return res.status(404).json({ message: "School not found" });
        }

        res.status(200).json({ message: "School verified successfully", school });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};