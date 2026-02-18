// backend/models/Restaurant.js

const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        default: ''
    },
    logo: {
        type: String,
        default: ''
    },

    // Скидки для разных уровней сотрудников
    discounts: {
        standard: {
            type: Number,
            default: 10       // 10% скидка
        },
        premium: {
            type: Number,
            default: 15       // 15% скидка
        },
        vip: {
            type: Number,
            default: 20       // 20% скидка
        }
    },

    contactPerson: {
        type: String,
        default: ''
    },
    contactPhone: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);