const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const Client = require('../models/Client');

// ===============================
// Create a new task
// ===============================
const createTask = async (req, res) => {
  try {
    console.log('Create task request:', {
      body: req.body,
      user: req.session.user
    });

    const userRole = req.session.user.role;

    if (userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager role required.'
      });
    }

    // 🔥 FORCE REMOVE empty clientId
    if (req.body.clientId === "") {
      delete req.body.clientId;
    }

    const {
      title,
      description,
      assignedTo,
      clientId,
      priority = 'medium',
      dueDate,
      notes,
      tags = []
    } = req.body;

    if (!title || !assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Title and assignedTo are required'
      });
    }

    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser || assignedUser.role !== 'employee') {
      return res.status(400).json({
        success: false,
        message: 'Assigned user must be an employee'
      });
    }

    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.session.user._id,
      clientId, // now undefined if empty
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes,
      tags
    });

    await task.save();

    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'assignedBy', select: 'name email' },
      { path: 'clientId', select: 'name company' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });

  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===============================
// Get tasks for current user
// ===============================
const getMyTasks = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userRole = req.session.user.role;
    const { status, priority, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (userRole === 'employee') {
      query.assignedTo = userId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    const tasks = await Task.find(query)
      .populate([
        { path: 'assignedTo', select: 'name email' },
        { path: 'assignedBy', select: 'name email' },
        { path: 'clientId', select: 'name company' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      tasks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===============================
// Update task status
// ===============================
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.session.user._id;

    if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (
      task.assignedTo.toString() !== userId.toString() &&
      req.session.user.role !== 'manager'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateData = { status };

    if (notes) updateData.notes = notes;
    if (status === 'completed') updateData.completedAt = new Date();

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'assignedBy', select: 'name email' },
      { path: 'clientId', select: 'name company' }
    ]);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===============================
// Get task statistics
// ===============================
const getTaskStats = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    let matchQuery = {};
    if (userRole === 'employee') {
      matchQuery.assignedTo = userId;
    }

    const stats = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          }
        }
      }
    ]);

    if (!stats.length) {
      return res.json({
        success: true,
        data: {
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          inProgressTasks: 0
        }
      });
    }

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===============================
// Delete task
// ===============================
const deleteTask = async (req, res) => {
  try {
    if (req.session.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager role required.'
      });
    }

    const { id } = req.params;

    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  createTask,
  getMyTasks,
  updateTaskStatus,
  getTaskStats,
  deleteTask
};