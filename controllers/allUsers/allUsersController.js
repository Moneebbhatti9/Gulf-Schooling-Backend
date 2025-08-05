const AllUsers = require("../../models/Auth/allUsersModel");


exports.getAllUsers = async (req, res) => {
    try {
        console.log("Fetching all users...");
        const users = await AllUsers.aggregate([
          // Match only verified users (optional)
          // { $match: { isVerified: true } },
    
          // Lookup for schools
          {
            $lookup: {
              from: "schools",
              localField: "_id",
              foreignField: "userId",
              as: "schoolData",
            },
          },
          // Lookup for teachers
          {
            $lookup: {
              from: "teachers",
              localField: "_id",
              foreignField: "userId",
              as: "teacherData",
            },
          },
          // Lookup for suppliers
          {
            $lookup: {
              from: "suppliers",
              localField: "_id",
              foreignField: "userId",
              as: "supplierData",
            },
          },
          // Lookup for recruiters (if you add recruiter schema later)
          // {
          //   $lookup: {
          //     from: "recruiters",
          //     localField: "_id",
          //     foreignField: "userId",
          //     as: "recruiterData",
          //   },
          // },
    
          // Merge role-specific data into one field (optional flattening)
          {
            $addFields: {
              roleData: {
                $cond: [
                  { $eq: ["$role", "school"] },
                  { $arrayElemAt: ["$schoolData", 0] },
                  {
                    $cond: [
                      { $eq: ["$role", "teacher"] },
                      { $arrayElemAt: ["$teacherData", 0] },
                      {
                        $cond: [
                          { $eq: ["$role", "supplier"] },
                          { $arrayElemAt: ["$supplierData", 0] },
                          null,
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
    
          // Project only needed fields
          {
            $project: {
              password: 0, // hide sensitive info
              otp: 0,
              otpExpiry: 0,
              resetOtp: 0,
              resetOtpExpiry: 0,
              refreshTokens: 0,
              schoolData: 0,
              teacherData: 0,
              supplierData: 0,
            },
          },
        ]);
    console.log("Users fetched successfully:", users);

        res.status(200).json(users);
} catch (err) {
        console.error("Error in aggregation:", err);
      res.status(500).json({
            message: "Error fetching users",
            error: err.message,
        });
      }

}