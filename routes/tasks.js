const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const Project = require('../models/project');
const { authMiddleware } = require('../middleware/auth');
const Joi = require('joi');

// Validation schema
const taskSchema = Joi.object({
  title: Joi.string().max(200).required(),
  description: Joi.string().max(2000).optional(),
  status: Joi.string().valid('todo', 'in-progress', 'review', 'completed').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  project: Joi.string().optional(),  // Changed to optional
  assignedTo: Joi.string().optional(),
  dueDate: Joi.date().optional(),
  tags: Joi.array().items(Joi.string()).optional()
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// Cache helper function
const getCachedData = async (redisClient, key) => {
  if (!redisClient?.isOpen) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
};

const setCachedData = async (redisClient, key, data, expirySeconds = 300) => {
  if (!redisClient?.isOpen) return;
  try {
    await redisClient.setEx(key, expirySeconds, JSON.stringify(data));
  } catch (error) {
    console.error('Redis set error:', error);
  }
};

const invalidateCache = async (redisClient, pattern) => {
  if (!redisClient?.isOpen) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Redis delete error:', error);
  }
};

// @route   GET /api/tasks
// @desc    Get all tasks (with optional filters)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { project, status, assignedTo, priority } = req.query;
    const redisClient = req.app.locals.redisClient;
    
    // Build query
    const query = {};
    if (project) query.project = project;
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;

    // Try to get from cache
    const cacheKey = `tasks:${JSON.stringify(query)}`;
    const cachedTasks = await getCachedData(redisClient, cacheKey);
    
    if (cachedTasks) {
      return res.json({
        success: true,
        cached: true,
        data: { tasks: cachedTasks }
      });
    }

    // Fetch from database
    const tasks = await Task.find(query)
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    // Cache the results
    await setCachedData(redisClient, cacheKey, tasks);

    res.json({
      success: true,
      cached: false,
      data: { tasks }
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks'
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const redisClient = req.app.locals.redisClient;
    const cacheKey = `task:${req.params.id}`;
    
    // Try cache first
    const cachedTask = await getCachedData(redisClient, cacheKey);
    if (cachedTask) {
      return res.json({
        success: true,
        cached: true,
        data: { task: cachedTask }
      });
    }

    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'username email profilePicture')
      .populate('createdBy', 'username email profilePicture')
      .populate('project', 'name color')
      .populate('comments.user', 'username email profilePicture');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Cache the task
    await setCachedData(redisClient, cacheKey, task);

    res.json({
      success: true,
      cached: false,
      data: { task }
    });

  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task'
    });
  }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const { error } = taskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Verify project exists if provided
    if (req.body.project) {
      const project = await Project.findById(req.body.project);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }
    }

    // Create task
    const task = new Task({
      ...req.body,
      createdBy: req.user.userId
    });

    await task.save();

    // Populate for response
    await task.populate('assignedTo', 'username email');
    await task.populate('createdBy', 'username email');
    if (task.project) {
      await task.populate('project', 'name');
    }

    // Invalidate cache
    const redisClient = req.app.locals.redisClient;
    await invalidateCache(redisClient, 'tasks:*');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating task'
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update fields
    const allowedUpdates = ['title', 'description', 'status', 'priority', 'assignedTo', 'dueDate', 'tags'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    // Update completedAt if status changed to completed
    if (req.body.status === 'completed' && task.status !== 'completed') {
      task.completedAt = new Date();
    }

    await task.save();

    // Populate for response
    await task.populate('assignedTo', 'username email');
    await task.populate('createdBy', 'username email');
    await task.populate('project', 'name');

    // Invalidate cache
    const redisClient = req.app.locals.redisClient;
    await invalidateCache(redisClient, 'tasks:*');
    await invalidateCache(redisClient, `task:${req.params.id}`);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task }
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating task'
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.deleteOne();

    // Invalidate cache
    const redisClient = req.app.locals.redisClient;
    await invalidateCache(redisClient, 'tasks:*');
    await invalidateCache(redisClient, `task:${req.params.id}`);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting task'
    });
  }
});

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private
router.post('/:id/comments', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.comments.push({
      user: req.user.userId,
      text: req.body.text
    });

    await task.save();
    await task.populate('comments.user', 'username email profilePicture');

    // Invalidate cache
    const redisClient = req.app.locals.redisClient;
    await invalidateCache(redisClient, `task:${req.params.id}`);

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: { task }
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
});

module.exports = router;