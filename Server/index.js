// ===== server/index.js =====
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 5000;

// --- لتحديد المسار الحالي ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- إعدادات Express ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- تقديم الملفات الثابتة (الواجهة الأمامية) ---
app.use(express.static(path.join(__dirname, '../public')));

// --- الصفحة الرئيسية (افتراضي) ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// --- مثال على API (اختياري مستقبلاً) ---
app.get('/api/status', (req, res) => {
  res.json({ message: 'Server is running successfully 🚀' });
});

// --- تشغيل السيرفر ---
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
