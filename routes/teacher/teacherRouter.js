const express = require("express");
const { 
    createTeacher, 
    getAllTeachers, 
    getTeacherById, 
    updateTeacher, 
    deleteTeacher, 
    verifyTeacher
} = require("../../controllers/teacher/teacherController");

const router = express.Router();

router.post('/create-teacher', createTeacher);
router.get('/get-all-teachers', getAllTeachers);
router.get('/get-teacher-by-id/:id', getTeacherById);
router.put('/update-teacher/:id', updateTeacher);
router.delete('/delete-teacher/:id', deleteTeacher);

//admin routes
router.put('/admin/verify-teacher/:id', verifyTeacher);


module.exports = router;