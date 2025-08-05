const express = require("express");
const { createSchool, getAllSchools, getSchoolById, deleteSchool, updateSchool, verifySchool } = require("../../controllers/school/schoolController");

const router = express.Router();

router.post('/create-school', createSchool)
router.get('/get-all-schools', getAllSchools),
router.get('/get-school-by-id/:id', getSchoolById),
router.put('/update-school/:id', updateSchool),
router.delete('/delete-school/:id', deleteSchool)

// admin route
router.put('/admin/verify-school/:id', verifySchool);

// router.use(verifyToken) 

//
module.exports = router ;
