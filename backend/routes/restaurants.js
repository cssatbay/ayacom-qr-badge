// backend/routes/restaurants.js

const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth');

// GET /api/restaurants — Список ресторанов
router.get('/', auth, async (req, res) => {
    try {
        const restaurants = await Restaurant.find({ isActive: true })
            .sort({ name: 1 });
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/restaurants — Добавить ресторан
router.post('/', auth, async (req, res) => {
    try {
        const restaurant = new Restaurant(req.body);
        await restaurant.save();
        res.status(201).json({ success: true, restaurant });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/restaurants/:id — Обновить
router.put('/:id', auth, async (req, res) => {
    try {
        const restaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json({ success: true, restaurant });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/restaurants/:id — Деактивировать
router.delete('/:id', auth, async (req, res) => {
    try {
        await Restaurant.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ success: true, message: 'Ресторан деактивирован' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;