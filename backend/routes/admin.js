// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth');

// ===== Логин =====
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('🔑 Login attempt:', username);

        const admin = await Admin.findOne({ username });
        if (!admin) {
            console.log('❌ Admin not found');
            return res.status(401).json({ 
                success: false,
                error: 'Неверный логин или пароль' 
            });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            console.log('❌ Password mismatch');
            return res.status(401).json({ 
                success: false,
                error: 'Неверный логин или пароль' 
            });
        }

        // 🔍 ОТЛАДКА - проверяем JWT_SECRET
        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET НЕ ЗАДАН!');
            return res.status(500).json({
                success: false,
                error: 'Ошибка конфигурации сервера'
            });
        }

        const token = jwt.sign(
            { 
                id: admin._id, 
                username: admin.username, 
                role: admin.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 🔍 ОТЛАДКА - проверяем созданный токен
        console.log('✅ Token created:', token.substring(0, 50) + '...');
        console.log('📦 Token parts:', token.split('.').length, 'parts');

        res.json({
            success: true,
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Ошибка сервера' 
        });
    }
});

// ===== Дашборд (статистика) =====
router.get('/dashboard', auth, async (req, res) => {
    try {
        const totalEmployees = await Employee.countDocuments();
        const activeEmployees = await Employee.countDocuments({ status: 'active' });
        const inactiveEmployees = await Employee.countDocuments({ status: 'inactive' });
        const totalRestaurants = await Restaurant.countDocuments();

        res.json({
            success: true,
            totalEmployees,
            activeEmployees,
            inactiveEmployees,
            totalRestaurants
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Ошибка загрузки статистики' 
        });
    }
});

// ===== Проверка токена =====
router.get('/verify', auth, (req, res) => {
    res.json({
        success: true,
        admin: req.admin
    });
});

module.exports = router;