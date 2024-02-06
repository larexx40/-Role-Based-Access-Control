
import dotenv from "dotenv";
import multer from 'multer';
import cloudinary from "cloudinary";
import { Request } from "express";
import sharp from "sharp";

interface CloudinaryFile extends Express.Multer.File {
    buffer: Buffer;
}

dotenv.config();
const { CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET } = process.env;

// Configure Multer for file upload
const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

//configure cloudinary
cloudinary.v2.config({
    cloud_name: CLOUDINARY_NAME,
    api_key: CLOUDINARY_KEY,
    api_secret: CLOUDINARY_SECRET,
});

// Function to upload a file to Cloudinary
export const uploadFile = (file: Express.Multer.File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
            {
                folder: "Telytech"
            },
            (error: any, result: any) => {
            if (error) {
                reject(error);
            } else {
                resolve(result.secure_url);
            }
        });

        // Pipe the buffer into the upload stream
        stream.end(file.buffer);
    });
};

export const processAndUploadImage = async (req: Request): Promise<string> => {
    try {
        console.log("reached here");
        
        if (!req.file) {
            throw new Error('No file uploaded');
        }

        const resizeImage = await sharp(req.file.buffer)
            .resize({ width: 300, height: 300 })
            .toBuffer();

        const imageUrl = await uploadFile({ ...req.file, buffer: resizeImage });

        return imageUrl;
    } catch (error) {
        console.error("Upload Image Error", error);
        throw new Error("Unable to upload image");
    }
};
