const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  head: {
    type: String,
    required: true
  },
  employeeCount: {
    type: Number,
    default: 0
  },
  budget: {
    type: Number,
    required: true,
    default: 0
  },
  location: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Department', departmentSchema);
