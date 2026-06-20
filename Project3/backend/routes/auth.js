const express = require('express');
const router = express.Router();
const { register, login, getUsers } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/users', auth, getUsers);

module.exports = router;