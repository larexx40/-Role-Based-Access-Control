import multer from 'multer';

// Configure Multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

export default upload;