import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  uploadExcel,
  getImports,
  getImportById,
  deleteImport,
} from '../controllers/import.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Multer config
const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xlsb', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté'));
    }
  },
});

router.use(authenticate);

router.get('/', getImports);
router.get('/:id', getImportById);
router.post('/upload', authorize('ADMIN', 'MANAGER'), upload.single('file'), uploadExcel);
router.delete('/:id', authorize('ADMIN'), deleteImport);

export default router;
