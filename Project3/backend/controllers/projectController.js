const Project = require('../models/Project');

exports.createProject = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const project = new Project({
      name,
      description,
      owner: req.user.id,
      members: members || [req.user.id]
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user.id }, { members: req.user.id }]
    }).populate('owner members', 'name email');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner members tasks.assignedTo tasks.comments.user', 'name email');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addTask = async (req, res) => {
  try {
    const { title, description, assignedTo } = req.body;
    const project = await Project.findById(req.params.id);
    
    const newTask = { title, description, assignedTo: assignedTo || null, status: 'Todo' };
    project.tasks.push(newTask);
    await project.save();

    global.io.to(req.params.id).emit('project_updated', project);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const project = await Project.findOne({ "tasks._id": req.params.taskId });
    const task = project.tasks.id(req.params.taskId);
    
    task.status = status;
    await project.save();

    global.io.to(project._id.toString()).emit('project_updated', project);
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const project = await Project.findOne({ "tasks._id": req.params.taskId });
    const task = project.tasks.id(req.params.taskId);

    task.comments.push({ user: req.user.id, text });
    await project.save();

    global.io.to(project._id.toString()).emit('project_updated', project);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};