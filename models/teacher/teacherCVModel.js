const mongoose = require("mongoose");

const cvSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      unique: true,
    },
    
    // Link to user through teacher
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    
    // Basic Information
    email: {
      type: String,
      required: true,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    },
    
    // Welcome Statement
    welcomeStatement: {
      type: String,
      maxLength: 2000,
    },
    
    // Basic Information Section
    basicInformation: {
      title: {
        type: String,
        enum: ["Mr", "Mrs", "Ms", "Dr", "Prof"],
      },
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
      placeOfBirth: String,
      nationality: String,
      address: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      phone: String,
      alternativePhone: String,
      passportNumber: String,
      gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
      },
      maritalStatus: {
        type: String,
        enum: ["Single", "Married", "Divorced", "Widowed"],
      },
      linkedIn: String,
    },
    
    // Languages Section - Aligned with UI
    languagesSpoken: [{
      language: {
        type: String,
        required: true,
      },
      proficiency: {
        type: String,
        enum: ["Native", "Fluent", "Advanced", "Intermediate", "Basic"],
        required: true,
      },
    }],
    
    // Employment History - Enhanced to match comprehensive needs
    employmentHistory: [{
      employer: {
        type: String,
        required: true,
      },
      position: String,
      location: String,
      stillWorkHere: {
        type: Boolean,
        default: false,
      },
      startDate: Date,
      endDate: Date,
      responsibilities: String,
      reasonForLeaving: String,
      contactPerson: String,
      contactEmail: String,
      contactPhone: String,
    }],
    
    // Teacher Qualifications - Perfectly aligned with UI
    teacherQualifications: [{
      provider: {
        type: String,
        required: true,
      },
      location: String,
      qualification: String,
      dateFrom: {
        month: String,
        year: Number,
      },
      dateTo: {
        month: String,
        year: Number,
      },
      dateExpiration: {
        month: String,
        year: Number,
      },
      ageRanges: [String],
      qualificationSubject: String,
      certificationNumber: String,
      isLifetime: Boolean,
    }],
    
    // Continuing Professional Development - Aligned with UI Images 6 & 7
    continuingProfessionalDevelopment: [{
      provider: String,
      course: String,
      duration: String,
      completionDate: Date,
      certificateNumber: String,
      description: String,
    }],
    
    // Membership of Professional Bodies - Enhanced
    membershipOfProfessionalBodies: [{
      organization: String,
      membershipType: String,
      membershipNumber: String,
      startDate: Date,
      expiryDate: Date,
      isLifetime: Boolean,
      benefits: String,
    }],
    
    // Educational Background - Restructured to match UI
    educationalBackground: {
      // Main/School Education (Image 4)
      schools: [{
        schoolName: String,
        startYear: Number,
        endYear: Number,
        location: String,
        subjects: [{
          subject: String,
          examYear: Number,
          grade: String,
        }],
        overallGrade: String,
        certificationType: String, // GCSE, A-Levels, etc.
      }],
      
      // Higher Education (Image 5)
      universities: [{
        schoolUniversity: String,
        townCity: String,
        qualification: String,
        areaOfStudy: String,
        startYear: Number,
        endYear: Number,
        grade: String,
        hasDoubleMajor: Boolean, // Changed from doubleMinor to match UI
        minorAreaOfStudy: String,
        thesis: String,
        honors: String,
        gpa: String,
      }],
      
      // Additional Certifications
      certifications: [{
        name: String,
        issuingOrganization: String,
        issueDate: Date,
        expiryDate: Date,
        credentialId: String,
        credentialUrl: String,
      }],
    },
    
    // Entrepreneurship
    entrepreneurship: {
      hasEntrepreneurialExperience: {
        type: Boolean,
        default: false,
      },
      ventures: [{
        businessName: String,
        role: String,
        startDate: Date,
        endDate: Date,
        isOngoing: Boolean,
        description: String,
        industry: String,
        achievements: String,
      }],
    },
    
    // Referee Information
    referees: [{
      name: String,
      position: String,
      organization: String,
      email: String,
      phone: String,
      relationship: String,
      yearsKnown: Number,
      canContact: {
        type: Boolean,
        default: true,
      },
      preferredContactMethod: {
        type: String,
        enum: ["Email", "Phone", "Both"],
        default: "Email",
      },
    }],
    
    // Additional Sections
    additionalSections: {
      hobbies: [String],
      interests: [String],
      achievements: String,
      publications: [{
        title: String,
        journal: String,
        year: Number,
        authors: String,
        doi: String,
        description: String,
      }],
      awards: [{
        title: String,
        organization: String,
        year: Number,
        description: String,
      }],
      volunteerWork: [{
        organization: String,
        role: String,
        startDate: Date,
        endDate: Date,
        isOngoing: Boolean,
        description: String,
        hoursPerWeek: Number,
      }],
      otherInformation: String,
      skills: [{
        category: String, // Technical, Soft Skills, etc.
        skills: [String],
      }],
      languages: [{ // Additional languages beyond spoken
        language: String,
        readingLevel: String,
        writingLevel: String,
        speakingLevel: String,
      }],
    },
    
    // Input Opportunities Information - Enhanced
    inputOpportunitiesInformation: {
      hasGulfExperience: {
        type: Boolean,
        default: false,
      },
      gulfExperienceDetails: [{
        country: String,
        position: String,
        organization: String,
        startDate: Date,
        endDate: Date,
        description: String,
      }],
      
      countriesLivedIn: [{
        country: String,
        duration: String,
        purpose: String, // Work, Study, Personal
        description: String,
      }],
      
      preferredCountries: [String],
      availabilityDate: Date,
      visaStatus: String,
      
      additionalInformation: String,
      
      // Teaching Preferences
      teachingPreferences: {
        preferredAgeGroups: [String],
        preferredSubjects: [String],
        preferredSchoolTypes: [String],
        willingToRelocate: Boolean,
        contractPreferences: [String],
      },
    },
    
    // Professional Development Goals
    professionalDevelopmentGoals: {
      shortTermGoals: String,
      longTermGoals: String,
      areasForImprovement: [String],
      careerAspirations: String,
    },
    
    // Digital Portfolio Links
    digitalPortfolio: {
      personalWebsite: String,
      linkedIn: String,
      teachingPortfolio: String,
      researchGate: String,
      googleScholar: String,
      orcid: String,
      other: [{
        platform: String,
        url: String,
        description: String,
      }],
    },
    
    // Meta Information
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isComplete: {
      type: Boolean,
      default: false,
    },
    completionPercentage: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastViewed: Date,
    
    // Version Control
    version: {
      type: Number,
      default: 1,
    },
    previousVersions: [{
      version: Number,
      data: mongoose.Schema.Types.Mixed,
      updatedAt: Date,
      updatedBy: String,
    }],
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better performance
// Note: teacher field already has unique index from schema definition
cvSchema.index({ email: 1 });
cvSchema.index({ isComplete: 1 });
cvSchema.index({ isPublic: 1 });
cvSchema.index({ "basicInformation.firstName": 1, "basicInformation.lastName": 1 });
cvSchema.index({ "teacherQualifications.qualification": 1 });
cvSchema.index({ "inputOpportunitiesInformation.preferredCountries": 1 });

// Virtual for full name
cvSchema.virtual('fullName').get(function() {
  if (this.basicInformation?.firstName && this.basicInformation?.lastName) {
    return `${this.basicInformation.firstName} ${this.basicInformation.lastName}`;
  }
  return null;
});

// Virtual for years of experience
cvSchema.virtual('totalExperienceYears').get(function() {
  if (!this.employmentHistory || this.employmentHistory.length === 0) return 0;
  
  let totalMonths = 0;
  this.employmentHistory.forEach(job => {
    if (job.startDate) {
      const endDate = job.endDate || new Date();
      const months = (endDate - job.startDate) / (1000 * 60 * 60 * 24 * 30.44);
      totalMonths += months;
    }
  });
  
  return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
});

// Methods to calculate completion percentage
cvSchema.methods.calculateCompletionPercentage = function() {
  let filledSections = 0;
  let totalSections = 12; // Total number of main sections
  
  // Check main sections
  if (this.email) filledSections++;
  if (this.welcomeStatement) filledSections++;
  
  // Basic Information (check key fields)
  if (this.basicInformation?.firstName && 
      this.basicInformation?.lastName && 
      this.basicInformation?.dateOfBirth &&
      this.basicInformation?.phone) {
    filledSections++;
  }
  
  // Languages
  if (this.languagesSpoken && this.languagesSpoken.length > 0) filledSections++;
  
  // Employment History
  if (this.employmentHistory && this.employmentHistory.length > 0) filledSections++;
  
  // Teacher Qualifications
  if (this.teacherQualifications && this.teacherQualifications.length > 0) filledSections++;
  
  // Educational Background
  if ((this.educationalBackground?.schools && this.educationalBackground.schools.length > 0) ||
      (this.educationalBackground?.universities && this.educationalBackground.universities.length > 0)) {
    filledSections++;
  }
  
  // CPD
  if (this.continuingProfessionalDevelopment && this.continuingProfessionalDevelopment.length > 0) filledSections++;
  
  // Referees
  if (this.referees && this.referees.length >= 2) filledSections++;
  
  // Input Opportunities
  if (this.inputOpportunitiesInformation?.hasGulfExperience !== undefined) filledSections++;
  
  // Additional Sections (at least one field filled)
  if (this.additionalSections && 
      (this.additionalSections.hobbies?.length > 0 || 
       this.additionalSections.interests?.length > 0 ||
       this.additionalSections.achievements ||
       this.additionalSections.skills?.length > 0)) {
    filledSections++;
  }
  
  // Digital Portfolio
  if (this.digitalPortfolio && 
      (this.digitalPortfolio.personalWebsite || 
       this.digitalPortfolio.linkedIn || 
       this.digitalPortfolio.teachingPortfolio)) {
    filledSections++;
  }
  
  const percentage = Math.round((filledSections / totalSections) * 100);
  this.completionPercentage = percentage;
  this.isComplete = percentage >= 85; // 85% completion considered complete
  
  return percentage;
};

// Method to get missing sections
cvSchema.methods.getMissingSections = function() {
  const missingSections = [];
  
  if (!this.email) missingSections.push('Email Address');
  if (!this.welcomeStatement) missingSections.push('Welcome Statement');
  
  if (!this.basicInformation?.firstName || !this.basicInformation?.lastName) {
    missingSections.push('Basic Information (Name)');
  }
  if (!this.basicInformation?.dateOfBirth) missingSections.push('Date of Birth');
  if (!this.basicInformation?.phone) missingSections.push('Phone Number');
  
  if (!this.languagesSpoken || this.languagesSpoken.length === 0) {
    missingSections.push('Languages Spoken');
  }
  
  if (!this.employmentHistory || this.employmentHistory.length === 0) {
    missingSections.push('Employment History');
  }
  
  if (!this.teacherQualifications || this.teacherQualifications.length === 0) {
    missingSections.push('Teacher Qualifications');
  }
  
  if ((!this.educationalBackground?.schools || this.educationalBackground.schools.length === 0) &&
      (!this.educationalBackground?.universities || this.educationalBackground.universities.length === 0)) {
    missingSections.push('Educational Background');
  }
  
  if (!this.referees || this.referees.length < 2) {
    missingSections.push('Referees (minimum 2 required)');
  }
  
  return missingSections;
};

// Update completion percentage before saving
cvSchema.pre('save', function(next) {
  this.calculateCompletionPercentage();
  this.lastUpdated = new Date();
  
  // Increment version if this is an update
  if (!this.isNew) {
    this.version += 1;
  }
  
  next();
});

// Method to create a backup before major updates
cvSchema.methods.createBackup = function() {
  if (!this.previousVersions) this.previousVersions = [];
  
  this.previousVersions.push({
    version: this.version,
    data: this.toObject(),
    updatedAt: new Date(),
    updatedBy: 'system'
  });
  
  // Keep only last 5 versions
  if (this.previousVersions.length > 5) {
    this.previousVersions = this.previousVersions.slice(-5);
  }
};

const CV = mongoose.model("CV", cvSchema);

module.exports = CV;