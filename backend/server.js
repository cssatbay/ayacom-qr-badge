const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const employeeRoutes = require('./routes/employees');
const adminRoutes = require('./routes/admin');
const restaurantRoutes = require('./routes/restaurants');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));
app.use('/public', express.static(path.join(__dirname, '../frontend/public')));

// API routes
app.use('/api/employees', employeeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/restaurants', restaurantRoutes);

// Badge page
app.get('/badge/:token', (req, res) => {
    const filePath = path.join(__dirname, '../frontend/public/badge.html');
    console.log('Badge request, sending file:', filePath);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.log('Error sending badge.html:', err.message);
            res.status(500).send('File not found');
        }
    });
});

// Home
app.get('/', (req, res) => {
    res.json({ service: 'AYACOM QR Badge System', status: 'running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('');
    console.log('AYACOM QR Badge Server');
    console.log('Port: ' + PORT);
    console.log('Admin: http://localhost:' + PORT + '/admin/');
    console.log('API: http://localhost:' + PORT + '/api/');
    console.log('');
});