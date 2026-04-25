const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  password: { type: String, required: true },
  role: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Role'
  },
  employeeId: { type: String, unique: true, sparse: true },
  baseSalary: { type: Number, default: 0 },
  dob: { type: Date },
  qualification: { type: String },
  experienceYears: { type: Number },
  designation: { type: String },
  joiningDate: { type: Date },
  timingSettings: {
    loginTime: { type: String, default: '09:30' },
    logoutTime: { type: String, default: '18:30' },
    graceTime: { type: Number, default: 15 }, // in minutes
    lunchStart: { type: String, default: '13:30' },
    lunchEnd: { type: String, default: '14:30' },
    lunchDuration: { type: Number, default: 45 }, // in minutes
    fromDate: { type: Date },
    toDate: { type: Date }
  },
  isEmailVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  permissions: [{ type: String }], // For granular subadmin permissions
  pushSubscriptions: [Object], // Store browser push subscriptions
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);
