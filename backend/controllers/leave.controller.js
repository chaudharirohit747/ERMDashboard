const Leave = require('../models/leave.model');

// Get all leave requests
exports.getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get leave requests by employee
exports.getEmployeeLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employeeId: req.params.employeeId })
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create leave request
exports.createLeave = async (req, res) => {
  try {
    const leave = new Leave({
      employeeId: req.body.employeeId,
      employeeName: req.body.employeeName,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      type: req.body.type,
      duration: req.body.duration,
      reason: req.body.reason,
      status: 'pending'
    });

    const newLeave = await leave.save();
    res.status(201).json(newLeave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update leave request
exports.updateLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Only allow updating specific fields
    const allowedUpdates = ['status', 'approvedBy', 'comments'];
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        leave[key] = req.body[key];
      }
    });

    if (req.body.status === 'approved' || req.body.status === 'rejected') {
      leave.approvalDate = new Date();
    }

    const updatedLeave = await leave.save();
    res.json(updatedLeave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete leave request
exports.deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (leave) {
      await leave.deleteOne();
      res.json({ message: 'Leave request deleted' });
    } else {
      res.status(404).json({ message: 'Leave request not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
