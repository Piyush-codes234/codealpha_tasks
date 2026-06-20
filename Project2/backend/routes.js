const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Post } = require('./models');
const router = express.Router();

// Middleware to protect routes
const auth = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
        const verified = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// --- AUTHENTICATION ---
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ _id: user._id, username: user.username }, process.env.JWT_SECRET);
    res.json({ token, username: user.username, userId: user._id });
});

// --- POSTS & COMMENTS ---
router.post('/posts', auth, async (req, res) => {
    const post = new Post({ user: req.user._id, content: req.body.content });
    await post.save();
    res.json(post);
});

router.get('/posts', async (req, res) => {
    const posts = await Post.find().populate('user', 'username').sort({ createdAt: -1 });
    res.json(posts);
});

router.post('/posts/:id/like', auth, async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (post.likes.includes(req.user._id)) {
        post.likes.pull(req.user._id); // Unlike
    } else {
        post.likes.push(req.user._id); // Like
    }
    await post.save();
    res.json(post);
});

router.post('/posts/:id/comment', auth, async (req, res) => {
    const post = await Post.findById(req.params.id);
    post.comments.push({ user: req.user._id, username: req.user.username, text: req.body.text });
    await post.save();
    res.json(post);
});

// --- FOLLOW SYSTEM ---
router.post('/users/:id/follow', auth, async (req, res) => {
    if (req.user._id === req.params.id) return res.status(400).json({ error: "Cannot follow yourself" });
    
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (currentUser.following.includes(targetUser._id)) {
        currentUser.following.pull(targetUser._id);
        targetUser.followers.pull(currentUser._id);
    } else {
        currentUser.following.push(targetUser._id);
        targetUser.followers.push(currentUser._id);
    }
    await currentUser.save();
    await targetUser.save();
    res.json({ message: "Follow status updated" });
});

module.exports = router;