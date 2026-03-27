const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['admin', 'subadmin', 'employee'], // Enforcing standard role names
  },
  permissions: [{
    type: String,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Role', RoleSchema);
