const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Admin = require('../models/Admin');
const Restaurant = require('../models/Restaurant');
const Employee = require('../models/Employee');
const QRGenerator = require('../utils/qrGenerator');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Подключено к MongoDB');

        // 1. Админ
        const existingAdmin = await Admin.findOne({ username: 'admin' });
        if (!existingAdmin) {
            const admin = new Admin({
                username: 'admin',
                email: 'hr@ayacom.com',
                password: 'admin123',
                role: 'superadmin'
            });
            await admin.save();
            console.log('👤 Админ создан: admin / admin123');
        } else {
            console.log('👤 Админ уже есть');
        }

        // 2. Рестораны — удаляем старые и создаём заново
        await Restaurant.deleteMany({});
        const restaurants = [
            {
                name: 'Ресторан "Уют"',
                address: 'ул. Абая 150',
                discounts: { standard: 10, premium: 15, vip: 20 },
                contactPerson: 'Айгуль',
                contactPhone: '+7 777 111 2233'
            },
            {
                name: 'Кафе "Восток"',
                address: 'пр. Аль-Фараби 77',
                discounts: { standard: 10, premium: 12, vip: 15 },
                contactPerson: 'Марат',
                contactPhone: '+7 777 444 5566'
            },
            {
                name: 'Burger House',
                address: 'ул. Сатпаева 22',
                discounts: { standard: 15, premium: 20, vip: 25 },
                contactPerson: 'Данияр',
                contactPhone: '+7 707 888 9900'
            }
        ];
        await Restaurant.insertMany(restaurants);
        console.log('🍽️  3 ресторана добавлены');

        // 3. Тестовый сотрудник — удаляем старых и создаём
        await Employee.deleteMany({});
        const qrToken = QRGenerator.generateToken();
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const qrData = await QRGenerator.generateQR(qrToken, baseUrl);

        const employee = new Employee({
            firstName: 'Алексей',
            lastName: 'Тестов',
            middleName: 'Демович',
            position: 'Senior Developer',
            department: 'IT Department',
            employeeId: 'AYA-0001',
            email: 'test@ayacom.com',
            phone: '+7 777 000 1122',
            discountTier: 'vip',
            qrCode: qrData.qrCode,
            qrUniqueToken: qrToken
        });
        await employee.save();

        console.log('');
        console.log('👨‍💻 Тестовый сотрудник создан:');
        console.log('   Имя: Алексей Тестов');
        console.log('   ID: AYA-0001');
        console.log('   Токен: ' + qrToken);
        console.log('');
        console.log('🔗 Открой в браузере:');
        console.log('   ' + qrData.qrUrl);
        console.log('');
        console.log('✅ Seed завершён!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        process.exit(1);
    }
}

seed();