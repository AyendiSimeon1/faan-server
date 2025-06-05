import multer from 'multer';
import AppError from '../utils/AppError';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to ensure only images are uploaded
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new AppError('Only image files are allowed!', 400));
    return;
  }
  cb(null, true);
};

// Configure multer middleware
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
