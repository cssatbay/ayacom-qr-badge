const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const QRGenerator = require('../utils/qrGenerator');
const auth = require('../middleware/auth');

// ===== Настройка загрузки фото =====
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/photos/'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueName}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeOk = allowedTypes.test(file.mimetype);
        if (extOk && mimeOk) return cb(null, true);
        cb(new Error('Разрешены только изображения: jpeg, jpg, png, webp'));
    }
});

// ==================================================
// POST /api/employees — ДОБАВИТЬ СОТРУДНИКА
// ==================================================
router.post('/', auth, upload.single('photo'), async (req, res) => {
    try {
        const {
            firstName, lastName, middleName,
            position, department, employeeId,
            email, phone, discountTier
        } = req.body;

        const existing = await Employee.findOne({
            $or: [{ email }, { employeeId }]
        });
        if (existing) {
            return res.status(400).json({
                error: 'Сотрудник с таким email или ID уже существует!'
            });
        }

        const qrToken = QRGenerator.generateToken();
        const baseUrl = process.env.BASE_URL;
        const qrData = await QRGenerator.generateQR(qrToken, baseUrl);

        const employee = new Employee({
            firstName,
            lastName,
            middleName: middleName || '',
            position,
            department,
            employeeId,
            email,
            phone: phone || '',
            discountTier: discountTier || 'standard',
            photo: req.file
                ? `/uploads/photos/${req.file.filename}`
                : '/uploads/photos/default-avatar.png',
            qrCode: qrData.qrCode,
            qrUniqueToken: qrToken
        });

        await employee.save();

        console.log(`Сотрудник ${firstName} ${lastName} добавлен`);
        console.log(`QR ссылка: ${qrData.qrUrl}`);

        res.status(201).json({
            success: true,
            message: 'Сотрудник добавлен! QR-код сгенерирован.',
            employee,
            qrUrl: qrData.qrUrl
        });

    } catch (error) {
        console.error('Ошибка добавления:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================================================
// GET /api/employees — СПИСОК СОТРУДНИКОВ
// ==================================================
router.get('/', auth, async (req, res) => {
    try {
        const { status, department, search, page = 1, limit = 20 } = req.query;

        let filter = {};
        if (status) filter.status = status;
        if (department) filter.department = department;
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const employees = await Employee.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Employee.countDocuments(filter);

        res.json({
            employees,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================================================
// GET /api/employees/badge/:token — ПУБЛИЧНАЯ СТРАНИЦА БЕЙДЖА
// ⚠️ ВАЖНО: этот маршрут ДОЛЖЕН быть ВЫШЕ чем /:id
// ==================================================
router.get('/badge/:token', async (req, res) => {
    try {
        const employee = await Employee.findOne({
            qrUniqueToken: req.params.token
        });

        if (!employee) {
            return res.status(404).json({
                error: 'Сотрудник не найден. QR-код недействителен.'
            });
        }

        if (employee.status !== 'active') {
            return res.status(403).json({
                error: 'Бейдж деактивирован',
                status: employee.status
            });
        }

        res.json({
            firstName: employee.firstName,
            lastName: employee.lastName,
            middleName: employee.middleName,
            position: employee.position,
            department: employee.department,
            employeeId: employee.employeeId,
            photo: employee.photo,
            status: employee.status,
            discountTier: employee.discountTier,
            company: 'AYACOM'
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================================================
// POST /api/employees/:id/regenerate-qr — НОВЫЙ QR КОД
// ⚠️ ВАЖНО: маршруты с подпутями ВЫШЕ чем просто /:id
// ==================================================
router.post('/:id/regenerate-qr', auth, async (req, res) => {
    try {
        const newToken = QRGenerator.generateToken();
        const baseUrl = process.env.BASE_URL;
        const qrData = await QRGenerator.generateQR(newToken, baseUrl);

        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            {
                qrCode: qrData.qrCode,
                qrUniqueToken: newToken,
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!employee) {
            return res.status(404).json({ error: 'Сотрудник не найден' });
        }

        res.json({
            success: true,
            message: 'QR-код перегенерирован! Старый больше не работает.',
            qrUrl: qrData.qrUrl,
            qrCode: qrData.qrCode
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================================================
// GET /api/employees/:id — ОДИН СОТРУДНИК
// ⚠️ ВАЖНО: этот маршрут ПОСЛЕДНИЙ чтобы не перехватывал /badge/
// ==================================================
router.get('/:id', auth, async (req, res) => {
    try {
        // Проверяем что id — валидный MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Неверный ID' });
        }

        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ error: 'Сотрудник не найден' });
        }
        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================================================
// PUT /api/employees/:id — ОБНОВИТЬ СОТРУДНИКА
// ==================================================
router.put('/:id', auth, upload.single('photo'), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Неверный ID' });
        }

        const updates = { ...req.body, updatedAt: Date.now() };

        if (req.file) {
            updates.photo = `/uploads/photos/${req.file.filename}`;
        }

        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!employee) {
            return res.status(404).json({ error: 'Сотрудник не найден' });
        }

        res.json({ success: true, employee });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================================================
// DELETE /api/employees/:id — ДЕАКТИВИРОВАТЬ
// ==================================================
router.delete('/:id', auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Неверный ID' });
        }

        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            { status: 'inactive', updatedAt: Date.now() },
            { new: true }
        );

        if (!employee) {
            return res.status(404).json({ error: 'Сотрудник не найден' });
        }

        res.json({
            success: true,
            message: `${employee.firstName} ${employee.lastName} деактивирован.`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;