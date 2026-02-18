// backend/config/db.js
// Подключение к MongoDB

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log('');
        console.log('=================================');
        console.log('✅ MongoDB подключена успешно!');
        console.log(`📍 Хост: ${conn.connection.host}`);
        console.log(`📂 База: ${conn.connection.name}`);
        console.log('=================================');
        console.log('');

    } catch (error) {
        console.error('');
        console.error('❌ ОШИБКА подключения к MongoDB:');
        console.error(error.message);
        console.error('');
        console.error('Проверь:');
        console.error('1. Запущена ли MongoDB');
        console.error('2. Правильная ли строка MONGODB_URI в .env');
        console.error('3. Разрешён ли твой IP в Atlas');
        console.error('');
        
        // Завершаем процесс с ошибкой
        process.exit(1);
    }
};

module.exports = connectDB;