import cloudinary from "cloudinary"
import  dotenv  from "dotenv";

dotenv.config();
const {CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET} = process.env;
//configure cloudinary
cloudinary.v2.config({
    cloud_name: CLOUDINARY_NAME,
    api_key: CLOUDINARY_KEY,
    api_secret: CLOUDINARY_SECRET,
});

export default cloudinary;