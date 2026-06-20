const express = require('express');
const router = express.Router();
const { createProject, getProjects, getProjectById, addTask, updateTaskStatus, addComment } = require('../controllers/projectController');
const auth = require('../middleware/auth');

router.use(auth); // Protect all routes

router.route('/').post(createProject).get(getProjects);
router.route('/:id').get(getProjectById);
router.route('/:id/tasks').post(addTask);
router.route('/tasks/:taskId/status').put(updateTaskStatus);
router.route('/tasks/:taskId/comments').post(addComment);

module.exports = router;