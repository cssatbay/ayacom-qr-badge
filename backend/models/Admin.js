// backend/models/Admin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
        // ⚠️ Пароль НИКОГДА не хранится в открытом виде
        // Он хэшируется перед сохранением (см. ниже)
    },
    role: {
        type: String,
        enum: ['hr', 'superadmin'],
        default: 'hr'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ===== ЭТО МАГИЯ: автоматическое хэширование пароля =====
// Перед каждым сохранением в базу пароль шифруется
adminSchema.pre('save', async function() {
    if (!this.isModified('password')) return;  // ← убрали next()
    
    this.password = await bcrypt.hash(this.password, 12);
    // ← убрали next()
});

// ===== Метод для проверки пароля при логине =====
adminSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);