const Attendance = require('../models/attendance.model');

// Get all attendance records
exports.getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find().sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance by employee
exports.getEmployeeAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ employeeId: req.params.employeeId })
      .sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create attendance record
exports.createAttendance = async (req, res) => {
  try {
    // Check if there's already an attendance record for this employee today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      employeeId: req.body.employeeId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        message: 'Attendance record already exists for today' 
      });
    }

    const attendance = new Attendance({
      employeeId: req.body.employeeId,
      employeeName: req.body.employeeName,
      date: new Date(),
      checkIn: req.body.checkIn,
      status: 'present',
      workHours: 0
    });

    const newAttendance = await attendance.save();
    res.status(201).json(newAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update attendance record
exports.updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Only update allowed fields
    const allowedUpdates = ['checkOut', 'status', 'notes', 'workHours'];
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        attendance[key] = req.body[key];
      }
    });

    const updatedAttendance = await attendance.save();
    res.json(updatedAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete attendance record
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (attendance) {
      await attendance.deleteOne();
      res.json({ message: 'Attendance record deleted' });
    } else {
      res.status(404).json({ message: 'Attendance record not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
