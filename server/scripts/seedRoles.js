require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');
const connectDB = require('../config/db');

// Connect to Database strictly for this script
connectDB();

const seedRoles = async () => {
  try {
    const rolesToSeed = [
      { name: 'admin', permissions: ['all'] },
      { name: 'subadmin', permissions: ['read_users', 'manage_attendance'] },
      { name: 'employee', permissions: ['read_own_data'] }
    ];

    for (let roleData of rolesToSeed) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        await Role.create(roleData);
        console.log(`Role '${roleData.name}' seeded successfully.`);
      } else {
        console.log(`Role '${roleData.name}' already exists.`);
      }
    }
    
    console.log('Role seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding roles:', err);
    process.exit(1);
  }
};

seedRoles();
