const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    companyEmailId: { 
        type: String, 
        required: true, 
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"], 
        validate: {
            validator: function (v) {
                return !v.includes("gmail.com") && !v.includes("yahoo.com");
            },
            message: "Personal email ID is not allowed"
        }
    },
    supplierCompanyName: { type: String, required: true },
    supplierRegistrationNo: { type: String, required: true },
    supplierAddress: { type: String, required: true },
    mainOfficeLocation: { type: String, required: true },
    mainOfficeCity: { type: String, required: true },
    mainOfficeCountry: { type: String, required: true },
    supplierOfficeNo: { type: String, required: true },
    mobileNo: { type: String, required: true },
    primaryCategory: { type: String, required: true },
    secondaryCategory: { type: String },
    tertiaryCategory: { type: String },
    sizeOfBusiness: { 
        type: String, 
        enum: ['Small', 'Medium', 'Large'], 
        required: true 
    },
    profitMargins: { type: String, required: true },
    numberOfPeopleEmployed: { type: String, required: true },
    turnoverLastYear: { type: Number, required: true },
    employersLiability: { type: Boolean, required: true },
    publicLiability: { type: Boolean, default: false },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    isAdminVerified:{
        type : Boolean,
        default : false
    }
}, { timestamps: true });

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
