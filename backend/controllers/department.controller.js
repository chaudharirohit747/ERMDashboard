const Department = require('../models/department.model');

const departmentController = {
  // Get all departments
  getAllDepartments: async (req, res) => {
    try {
      const departments = await Department.find();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get a single department
  getDepartment: async (req, res) => {
    try {
      const department = await Department.findById(req.params.id);
      if (department) {
        res.json(department);
      } else {
        res.status(404).json({ message: 'Department not found' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Create a department
  createDepartment: async (req, res) => {
    try {
      // Check if department with same name exists
      const existingDepartment = await Department.findOne({ name: req.body.name });
      if (existingDepartment) {
        return res.status(400).json({ message: 'A department with this name already exists' });
      }

      const department = new Department({
        name: req.body.name,
        description: req.body.description,
        head: req.body.head,
        employeeCount: req.body.employeeCount,
        budget: req.body.budget,
        location: req.body.location
      });

      const newDepartment = await department.save();
      res.status(201).json(newDepartment);
    } catch (error) {
      if (error.code === 11000) {
        res.status(400).json({ message: 'A department with this name already exists' });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  },

  // Update a department
  updateDepartment: async (req, res) => {
    try {
      // If name is being updated, check for duplicates
      if (req.body.name) {
        const existingDepartment = await Department.findOne({ 
          name: req.body.name,
          _id: { $ne: req.params.id }
        });
        if (existingDepartment) {
          return res.status(400).json({ message: 'A department with this name already exists' });
        }
      }

      const department = await Department.findById(req.params.id);
      if (department) {
        Object.assign(department, req.body);
        const updatedDepartment = await department.save();
        res.json(updatedDepartment);
      } else {
        res.status(404).json({ message: 'Department not found' });
      }
    } catch (error) {
      if (error.code === 11000) {
        res.status(400).json({ message: 'A department with this name already exists' });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  },

  // Delete a department
  deleteDepartment: async (req, res) => {
    try {
      const department = await Department.findById(req.params.id);
      if (department) {
        await department.deleteOne();
        res.json({ message: 'Department deleted' });
      } else {
        res.status(404).json({ message: 'Department not found' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = departmentController;
