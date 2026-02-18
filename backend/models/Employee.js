// backend/models/Employee.js
// Модель сотрудника — описывает какие данные хранятся в базе

const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({

    // ===== Личные данные =====
    firstName: {
        type: String,        // Тип: строка
        required: true,      // Обязательное поле
        trim: true           // Убирает пробелы по краям
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    middleName: {
        type: String,
        trim: true,
        default: ''          // Необязательное, по умолчанию пустое
    },

    // ===== Рабочие данные =====
    position: {
        type: String,        // Должность: "Frontend Developer"
        required: true
    },
    department: {
        type: String,        // Отдел: "IT Department"
        required: true
    },
    employeeId: {
        type: String,        // Табельный номер: "AYA-0042"
        unique: true,        // Не может повторяться
        required: true
    },

    // ===== Фото =====
    photo: {
        type: String,
        default: '/uploads/photos/default-avatar.png'
    },

    // ===== QR код =====
    qrCode: {
        type: String         // Base64 изображение QR кода
    },
    qrUniqueToken: {
        type: String,        // Уникальный токен для ссылки
        unique: true
    },

    // ===== Контакты =====
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true      // Приводит к нижнему регистру
    },
    phone: {
        type: String,
        default: ''
    },

    // ===== Статус =====
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],  // Только эти значения
        default: 'active'
    },

    // ===== Уровень скидки =====
    discountTier: {
        type: String,
        enum: ['standard', 'premium', 'vip'],
        default: 'standard'
    },

    // ===== Даты =====
    hireDate: {
        type: Date,
        default: Date.now    // Дата приёма на работу
    },
    createdAt: {
        type: Date,
        default: Date.now    // Дата создания записи
    },
    updatedAt: {
        type: Date,
        default: Date.now    // Дата последнего обновления
    }
});

// Перед сохранением обновляем дату
employeeSchema.pre('save', function() {
    this.updatedAt = Date.now();
    // next() не нужен
});

// Создаём модель из схемы
// 'Employee' → коллекция будет называться 'employees' в MongoDB
const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;