const User = require('../models/User');
const { validationResult } = require('express-validator');

// ================= REGISTER =================
const register = async (req, res) => {
  try {
    console.log("Incoming body:", req.body);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log("Validation Errors:", errors.array());

      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg, // show first real error
        errors: errors.array()
      });
    }

    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = new User({
      name,
      email,
      password,
      role
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Server error:", error);

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ================= LOGIN =================
const login = async (req, res) => {
  try {
    console.log("Login body:", req.body);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log("Login Validation Errors:", errors.array());

      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.json({
      success: true,
      message: 'Login successful',
      user: req.session.user
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ================= LOGOUT =================
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Could not log out'
      });
    }

    res.clearCookie('crm.session'); // fixed cookie name
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
};

// ================= GET CURRENT USER =================
const getCurrentUser = (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  res.json({
    success: true,
    user: req.session.user
  });
};

// ================= GET EMPLOYEES =================
const getEmployees = async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const userRole = req.session.user.role;

    if (userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager role required.'
      });
    }

    const employees = await User.find({
      role: 'employee',
      isActive: true
    })
      .select('_id name email')
      .sort({ name: 1 });

    res.json({
      success: true,
      employees
    });

  } catch (error) {
    console.error("Get employees error:", error);

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  getEmployees
};