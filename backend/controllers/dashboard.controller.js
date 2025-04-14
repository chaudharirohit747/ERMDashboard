const Employee = require('../models/employee.model');
const Department = require('../models/department.model');
const Leave = require('../models/leave.model');

exports.getDashboardStats = async (req, res) => {
    try {
        // Get total employees count
        const totalEmployees = await Employee.countDocuments();
        
        // Get departments count
        const totalDepartments = await Department.countDocuments();
        
        // Get new hires (employees joined in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newHires = await Employee.countDocuments({
            hireDate: { $gte: thirtyDaysAgo }
        });
        
        // Get pending leave requests
        const pendingLeaves = await Leave.countDocuments({ status: 'pending' });

        res.json({
            totalEmployees,
            totalDepartments,
            newHires,
            pendingLeaves
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEmployeeGrowth = async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        
        const monthlyData = await Employee.aggregate([
            {
                $match: {
                    hireDate: { $lte: new Date() }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$hireDate" },
                        month: { $month: "$hireDate" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            },
            {
                $limit: 6
            }
        ]);

        const months = monthlyData.map(data => {
            const date = new Date(data._id.year, data._id.month - 1);
            return date.toLocaleString('default', { month: 'short' });
        });

        const counts = monthlyData.map(data => data.count);

        res.json({
            labels: months,
            data: counts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDepartmentDistribution = async (req, res) => {
    try {
        const distribution = await Employee.aggregate([
            {
                $lookup: {
                    from: 'departments',
                    localField: 'departmentId',
                    foreignField: '_id',
                    as: 'department'
                }
            },
            {
                $unwind: '$department'
            },
            {
                $group: {
                    _id: '$department.name',
                    count: { $sum: 1 }
                }
            }
        ]);

        const labels = distribution.map(d => d._id);
        const data = distribution.map(d => d.count);

        res.json({
            labels,
            data
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRecentActivities = async (req, res) => {
    try {
        // Get recent new hires (6 items)
        const recentHires = await Employee.find()
            .sort({ hireDate: -1 })
            .limit(6);

        // Format activities (only new hires)
        const activities = recentHires.map(hire => ({
            type: 'new_hire',
            message: `${hire.firstName} ${hire.lastName} joined as ${hire.position}`,
            time: hire.hireDate
        }));

        // Sort by time
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));

        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
