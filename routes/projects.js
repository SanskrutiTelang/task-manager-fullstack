const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { authMiddleware } = require('../middleware/auth');
const Joi = require('joi');

// Validation schema
const projectSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(1000).optional(),
  status: Joi.string().valid('planning', 'active', 'on-hold', 'completed', 'archived').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  color: Joi.string().optional(),
  isPrivate: Joi.boolean().optional()
});

// Apply auth middleware
router.use(authMiddleware);

// @route   GET /api/projects
// @desc    Get all projects for user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user.userId },
        { 'members.user': req.user.userId }
      ]
    })
    .populate('owner', 'username email')
    .populate('members.user', 'username email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { projects }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching projects'
    });
  }
});

// @route   GET /api/projects/:id
// @desc    Get single project
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username email profilePicture')
      .populate('members.user', 'username email profilePicture');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access
    const hasAccess = project.owner._id.toString() === req.user.userId ||
                     project.members.some(m => m.user._id.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { project }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project'
    });
  }
});

// @route   POST /api/projects
// @desc    Create new project
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { error } = projectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const project = new Project({
      ...req.body,
      owner: req.user.userId,
      members: [{
        user: req.user.userId,
        role: 'owner'
      }]
    });

    await project.save();
    await project.populate('owner', 'username email');
    await project.populate('members.user', 'username email');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating project'
    });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner or admin
    const userMember = project.members.find(m => m.user.toString() === req.user.userId);
    if (project.owner.toString() !== req.user.userId && 
        (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin'))) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner or admin can update project'
      });
    }

    const allowedUpdates = ['name', 'description', 'status', 'startDate', 'endDate', 'color', 'isPrivate'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    await project.save();
    await project.populate('owner', 'username email');
    await project.populate('members.user', 'username email');

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project }
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating project'
    });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only owner can delete
    if (project.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can delete project'
      });
    }

    await project.deleteOne();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting project'
    });
  }
});

// @route   POST /api/projects/:id/members
// @desc    Add member to project
// @access  Private
router.post('/:id/members', async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'userId and role are required'
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if requester is owner or admin
    const requesterMember = project.members.find(m => m.user.toString() === req.user.userId);
    if (project.owner.toString() !== req.user.userId &&
        (!requesterMember || (requesterMember.role !== 'owner' && requesterMember.role !== 'admin'))) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner or admin can add members'
      });
    }

    // Check if user already a member
    if (project.members.some(m => m.user.toString() === userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member'
      });
    }

    project.members.push({ user: userId, role });
    await project.save();
    await project.populate('members.user', 'username email');

    res.json({
      success: true,
      message: 'Member added successfully',
      data: { project }
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding member'
    });
  }
});

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Remove member from project
// @access  Private
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check permissions
    const requesterMember = project.members.find(m => m.user.toString() === req.user.userId);
    if (project.owner.toString() !== req.user.userId &&
        (!requesterMember || (requesterMember.role !== 'owner' && requesterMember.role !== 'admin'))) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner or admin can remove members'
      });
    }

    // Can't remove owner
    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove project owner'
      });
    }

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing member'
    });
  }
});

module.exports = router;