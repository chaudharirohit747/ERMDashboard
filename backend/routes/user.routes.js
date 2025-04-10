const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      role: role || 'employee'
    });

    await user.save();

    // Create token
    const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '24h' });

    // Return user data (excluding password) and token
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ user: userResponse, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password });
    
    // Find user by email
    const user = await User.findOne({ email });
    console.log('User found:', user);
    
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // For admin@gmail.com, allow direct login with admin123
    if (email === 'admin@gmail.com' && password === 'admin123') {
      console.log('Admin login successful');
      console.log('Admin login successful, creating response');
      const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '24h' });
      const userResponse = {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      };
      console.log('Sending response:', userResponse);
      return res.json(userResponse);
    }

    // For other users, check password hash
    console.log('Comparing password for user:', email);
    console.log('Stored password hash:', user.password);
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Password does not match for user:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create token
    console.log('Creating token for user:', email);
    const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '24h' });

    // Return user data (excluding password) and token
    const userResponse = {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };

    console.log('Login successful for user:', email);
    console.log('Sending response:', userResponse);
    res.json(userResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all users (admin only)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Don't allow password updates through this endpoint

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Logout (just for completeness, actual token invalidation should be handled on client)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
