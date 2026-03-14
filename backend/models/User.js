const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'subadmin', 'employee'], default: 'employee' },
  employeeId: { type: String, unique: true, sparse: true },
  baseSalary: { type: Number, default: 0 },
  timingSettings: {
    loginTime: { type: String, default: '09:30' },
    logoutTime: { type: String, default: '18:30' },
    graceTime: { type: Number, default: 15 }, // in minutes
    lunchStart: { type: String, default: '13:30' },
    lunchEnd: { type: String, default: '14:30' },
    lunchDuration: { type: Number, default: 45 } // in minutes
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', UserSchema);
