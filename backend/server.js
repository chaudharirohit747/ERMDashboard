require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const departmentRoutes = require('./routes/department.routes');
const employeeRoutes = require('./routes/employee.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const leaveRoutes = require('./routes/leave.routes');
const userRoutes = require('./routes/user.routes');
const dashboardController = require('./controllers/dashboard.controller');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Set mongoose options
mongoose.set('strictQuery', false);

// MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority',
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
};

// Connect to MongoDB with more detailed error handling
console.log('Connecting to MongoDB...');
console.log('MongoDB URI:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@'));

mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    
    // Only start the server after successful DB connection
    const port = process.env.PORT || 3002;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      codeName: err.codeName
    });
    process.exit(1);
  });

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ERM Dashboard API' });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);

// Dashboard routes
app.get('/api/dashboard/stats', dashboardController.getDashboardStats);
app.get('/api/dashboard/employee-growth', dashboardController.getEmployeeGrowth);
app.get('/api/dashboard/department-distribution', dashboardController.getDepartmentDistribution);
app.get('/api/dashboard/recent-activities', dashboardController.getRecentActivities);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});
