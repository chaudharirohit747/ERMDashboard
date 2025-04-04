const Department = require('../models/department.model');

// Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single department
exports.getDepartment = async (req, res) => {
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
};

// Create a department
exports.createDepartment = async (req, res) => {
  const department = new Department({
    name: req.body.name,
    description: req.body.description,
    manager: req.body.manager,
    employeeCount: req.body.employeeCount
  });

  try {
    const newDepartment = await department.save();
    res.status(201).json(newDepartment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a department
exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (department) {
      Object.assign(department, req.body);
      const updatedDepartment = await department.save();
      res.json(updatedDepartment);
    } else {
      res.status(404).json({ message: 'Department not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a department
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (department) {
      await department.remove();
      res.json({ message: 'Department deleted' });
    } else {
      res.status(404).json({ message: 'Department not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
