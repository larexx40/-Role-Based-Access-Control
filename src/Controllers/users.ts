import { NextFunction, Request, Response } from "express";
import { OTPExpiryTime, generateVerificationOTP, hashPassword } from "../Utils/utils";
import { IUser } from "../Models/users";

class UserController{
    static async signup(req: Request, res: Response, next: NextFunction): Promise<void>{
        // Check if the request body is empty
        if (!req.body || Object.keys(req.body).length === 0) {
            res.status(400).json({ 
                status: false, 
                message: "Request body is required",
                error: [],
                data: []
            });
            return;
        }

        const {name, email, phoneno, password, role, username, dob, address} = req.body;
        if(!name || !phoneno || !email || !username || !password){
            res.status(400).json({ 
                status: false, 
                message: "Pass in the required fields",
                error: [],
                data: []
            });
            return;
        }

        const newPassword = await hashPassword(password);
        const verificationOtp = generateVerificationOTP();
        const verificationOtpExpiry = new Date(Date.now() + OTPExpiryTime)
        const user: IUser={
            name,
            email,
            phoneno, 
            password: newPassword,
            

        }
    }
}

export default UserController;