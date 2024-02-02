import bcrypt from 'bcrypt';
import dotenv from 'dotenv'
import * as fileType from 'file-type';

dotenv.config()

//6 digit number by default
export const generateVerificationOTP = (digits: number = 6) => {
    // Generate the first digit (1-9)
    const firstDigit = Math.floor(Math.random() * 9) + 1;
    let otp = `${firstDigit}`
    for (let i = 1; i < digits; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return parseInt(otp);
}

// hash password using bcrypt
export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
}

// to compare plain password with hashed password
export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<Boolean> => {
    return await bcrypt.compare(plainPassword, hashedPassword);
}

export const OTPExpiryTime : number = (5 * 60 * 1000);

// export const validateImage = (fileBuffer: Buffer): boolean {
//     const imageType = fileType(fileBuffer);
//     return imageType !== null && imageType.mime.startsWith('image/');
// }

function validateImage(fileBuffer: Buffer): boolean {
    const imageType = fileType(fileBuffer);
    return imageType !== null && imageType.mime.startsWith('image/');
}