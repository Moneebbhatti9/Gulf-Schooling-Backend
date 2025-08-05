const Teacher = require("../../models/teacher/teacherModel");
const AllUsers = require("../../models/Auth/allUsersModel")

// Create a new teacher
exports.createTeacher = async (req, res) => {
    try {
        const { userId } = req.body;

        // Check if a teacher with the same userId already exists
        const existingTeacher = await Teacher.findOne({ userId: userId });
        if (existingTeacher) {
            return res.status(400).json({ message: "Teacher with this userId already exists" });
        }

        const teacher = new Teacher(req.body);
        await teacher.save();
        const user = await AllUsers.findByIdAndUpdate(
            userId,
            { isVerified: true },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(201).json(teacher);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


// Get all teachers
exports.getAllTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find().populate('userId');
        res.status(200).json(teachers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a teacher by ID
exports.getTeacherById = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id).populate('userId');
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
        res.status(200).json(teacher);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a teacher by ID
exports.updateTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
        res.status(200).json(teacher);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a teacher by ID
exports.deleteTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findByIdAndDelete(req.params.id);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
        res.status(200).json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.verifyTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            { isAdminVerified: true },
            { new: true }
        );

        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        res.status(200).json({ message: "Teacher verified successfully", teacher });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};