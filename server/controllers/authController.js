const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const db = require('../config/database');
const logger = require('../config/logger');

const signupSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const generateToken = (user) => {
    return jwt.sign(
        { user_id: user.user_id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

exports.signup = async (req, res) => {
    try {
        const { error, value } = signupSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { username, email, password } = value;

        const [existing] = await db.query(
            'SELECT user_id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );
        if (existing.length) {
            return res.status(409).json({ error: 'Email or username already in use' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, password_hash]
        );

        const user = { user_id: result.insertId, email, role: 'user' };
        const token = generateToken(user);

        logger.info(`New user registered: ${email}`);
        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: { user_id: user.user_id, username, email, role: 'user' }
        });
    } catch (err) {
        logger.error('Signup error:', err);
        res.status(500).json({ error: 'Failed to create account' });
    }
};

exports.login = async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { email, password } = value;
        const [rows] = await db.query(
            'SELECT user_id, username, email, password_hash, role FROM users WHERE email = ?',
            [email]
        );

        if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = rows[0];
        const token = generateToken(user);

        logger.info(`User logged in: ${email}`);
        res.json({
            message: 'Login successful',
            token,
            user: { user_id: user.user_id, username: user.username, email: user.email, role: user.role }
        });
    } catch (err) {
        logger.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT user_id, username, email, role, created_at FROM users WHERE user_id = ?',
            [req.user.user_id]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};
