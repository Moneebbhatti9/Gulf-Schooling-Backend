const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User collection
        required: true,
      },
    fullName: { type: String, required: true },
    address: { type: String, required: true },
    streetName: { type: String, required: true },
    areaName: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    schoolEmail: { 
        type: String, 
        required: true, 
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, 'Please enter a valid email'],
        validate: {
            validator: function(email) {
                return !email.match(/@(gmail|yahoo|hotmail)\.com$/); // Reject personal emails
            },
            message: 'Personal email IDs are not accepted'
        }
    },
    contactNumber: { 
        type: String, 
        required: true, 
        match: [/^\+?\d{10,15}$/, 'Please enter a valid contact number'] 
    },
    website: { type: String },
    mapLocation: { 
        latitude: { type: Number  }, 
        longitude: { type: Number }
    },
    // username: { 
    //     type: String, 
    //     required: true, 
    //     unique: true, 
    //     match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, 'Please enter a valid email']
    // },
    // password: { 
    //     type: String, 
    //     required: true, 
    //     minlength: 8,
    //     validate: {
    //         validator: function(password) {
    //             return /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
    //         },
    //         message: 'Password must be at least 8 characters long and contain one uppercase letter, one number, and one special character'
    //     }
    // },
    curriculumTaught: { type: String, required: true },
    schoolType: { type: String, enum: ['girls', 'boys', 'mix'], required: true },
    ageGroup: { 
        from: { type: Number, required: true }, 
        to: { type: Number, required: true }
    },
    description: { type: String, maxlength: 100 },
    branches: { type: Number, required: true },
    isAdminVerified:{
        type : Boolean,
        default : false
    }
}, { timestamps: true });

const School = mongoose.model('School', schoolSchema);

module.exports = School;
