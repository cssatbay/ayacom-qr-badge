// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // 🔍 Отладка (временно)
       console.log('🔐 Auth check:', {
    hasHeader: !!authHeader,
    jwtSecret: process.env.JWT_SECRET ? 'EXISTS' : 'MISSING',
    tokenPreview: authHeader ? authHeader.substring(0, 50) : 'NO HEADER'  // ← ДОБАВЬТЕ ЭТУ СТРОКУ
});

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Нет токена авторизации. Войдите в систему.'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: 'Неверный формат токена'
            });

            

        }

        // Проверяем токен
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        console.log('✅ Token decoded:', decoded);

        // Проверяем существование админа в БД
        const admin = await Admin.findById(decoded.id).select('-password');
        
        if (!admin) {
            return res.status(401).json({
                error: 'Пользователь не найден. Войдите заново.'
            });
        }

        // Добавляем полные данные админа
        req.admin = admin;
        req.adminId = admin._id;

        next();

    } catch (error) {
        console.error('❌ Auth error:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Токен недействителен. Войдите заново.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Токен истёк. Войдите заново.'
            });
        }

        return res.status(500).json({
            error: 'Ошибка проверки авторизации'
        });
    }
};