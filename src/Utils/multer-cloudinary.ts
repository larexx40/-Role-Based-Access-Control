// // multerCloudinaryConfig.ts
// import { StorageEngine } from 'multer';
// import { CloudinaryStorage } from 'multer-storage-cloudinary';
// import cloudinary from './cloudinaryConfig'; // Import your Cloudinary configuration

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
  
//   params: {
//     folder: 'your-upload-folder', // Specify the Cloudinary folder
//     format: async (req, file) => 'jpg', // Specify the file format (optional)
//   },
// });
// const upload: StorageEngine = multer({ storage: storage });

// export default upload;