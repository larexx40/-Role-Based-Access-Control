
import  dotenv  from "dotenv";
import multer, { Multer } from 'multer';
import cloudinary from "cloudinary";
import sharp from "sharp";

interface CloudinaryFile extends Express.Multer.File {
    buffer: Buffer;
}


// Configure Multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });


dotenv.config();
const {CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET} = process.env;
//configure cloudinary
cloudinary.v2.config({
    cloud_name: CLOUDINARY_NAME,
    api_key: CLOUDINARY_KEY,
    api_secret: CLOUDINARY_SECRET,
});


// Function to upload a file to Cloudinary
export const uploadFile = (file: any): Promise<string> => {
    return new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload(file, (error: any, result: any) => {
            if (error) {
                reject(error);
            } else {
                resolve(result.secure_url);
            }
        });
    });
};

//resize and upload image
export const uploadImage = async (image: CloudinaryFile)=>{
    try {
        const resizeImage = await sharp(image.buffer)
        .resize({ width: 300, height: 300 })
        .toBuffer();

        const imageUrl = await uploadFile(resizeImage)

        return imageUrl;
    } catch (error) {
        console.error("Upload Imaage Error", error)
        throw new Error("Unable to upload image");
        
    }
}

