const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUsers, getProfile } = require('../controllers/userController');
const authenticateToken = require('../middlewares/auth');
const { validateRegister, validateLogin } = require('../middlewares/validators');

router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.get('/', getUsers);
router.get('/profile', authenticateToken, getProfile);

module.exports = router;
