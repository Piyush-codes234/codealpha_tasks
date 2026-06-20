const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Product, Order } = require('./models');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.log('❌ MongoDB Error:', err));

// --- AUTHENTICATION MIDDLEWARE ---
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

// --- ROUTES ---

// 1. Auth: Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(400).json({ error: 'Email already exists or invalid data.' });
    }
});

// 2. Auth: Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials.' });

        const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// 3. Products: Get All
app.get('/api/products', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

// 4. Products: Get Single Product
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(400).json({ error: 'Invalid Product ID' });
    }
});

// 5. Orders: Create Order (Requires Auth)
app.post('/api/orders', verifyToken, async (req, res) => {
    try {
        const { products, totalAmount } = req.body;
        const newOrder = new Order({ user: req.user.id, products, totalAmount });
        await newOrder.save();
        res.status(201).json({ message: 'Order placed successfully!', order: newOrder });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process order.' });
    }
});

// 6. Utility: Seed Database with Dummy Products
app.post('/api/seed', async (req, res) => {
    const sampleProducts = [
        { name: 'Wireless Headphones', description: 'Noise-cancelling over-ear headphones.', price: 199.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500' },
        { name: 'Smart Watch', description: 'Fitness tracker with heart rate monitor.', price: 149.50, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500' },
        { name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard with tactile switches.', price: 89.99, image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500' }
    ];
    await Product.insertMany(sampleProducts);
    res.json({ message: 'Sample products added!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));