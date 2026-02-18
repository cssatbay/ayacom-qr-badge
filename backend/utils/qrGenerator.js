// backend/utils/qrGenerator.js

const QRCode = require('qrcode');
const crypto = require('crypto');

class QRGenerator {

    // Генерация случайного токена (32 символа)
    static generateToken() {
        return crypto.randomBytes(16).toString('hex');
        // Пример: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
    }

    // Генерация QR кода
    static async generateQR(token, baseUrl) {
        // Ссылка которая будет в QR коде
        const url = `${baseUrl}/badge/${token}`;

        try {
            // Создаём QR как base64 картинку
            const qrDataUrl = await QRCode.toDataURL(url, {
                width: 400,           // Размер в пикселях
                margin: 2,            // Отступ
                color: {
                    dark: '#1a1a2e',  // Цвет точек (тёмно-синий AYACOM)
                    light: '#ffffff'  // Цвет фона (белый)
                },
                errorCorrectionLevel: 'H'  // Высокая коррекция ошибок
                // H = 30% QR кода может быть повреждено и всё равно сработает
            });

            return {
                qrCode: qrDataUrl,   // Base64 картинка
                qrUrl: url,          // Ссылка
                token: token         // Токен
            };

        } catch (error) {
            throw new Error(`Ошибка генерации QR: ${error.message}`);
        }
    }
}

module.exports = QRGenerator;