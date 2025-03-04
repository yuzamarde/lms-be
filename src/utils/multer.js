import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

// Konfigurasi penyimpanan di Cloudinary
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'courses', // Folder di Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg'],
        public_id: (req, file) => `course-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    },
});

// Filter file hanya untuk gambar
const fileFilter = (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and JPG are allowed!'), false);
    }
};

const upload = multer({ storage, fileFilter });

export default upload;
