import cloudinary from "cloudinary"
import  dotenv  from "dotenv";
import { resolve } from "path";

dotenv.config();
const {CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET} = process.env;
//configure cloudinary
cloudinary.v2.config({
    cloud_name: CLOUDINARY_NAME,
    api_key: CLOUDINARY_KEY,
    api_secret: CLOUDINARY_SECRET,
});

export const uploadFile = async (file: any)=>{
    return new Promise(resolve =>{
        cloudinary.v2.uploader.upload(file, (_err: any, res: any)=>{
            resolve({
                res: res.secure_url
            })
        })
    })
    // return new Promise(resolve => {
    //     cloudinary.v2.uploader.upload(file, (_err: any, res: any) => {
    //       resolve({
    //         res: res.secure_url,
    //       })
    //     })
    //   })
}

// const  uploadFile = (file)=>{
//     return new Promise((resolve) =>{
//         cloudinary.UploadStream()
//     })
// }
// export default cloudinary;