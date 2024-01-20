import { UserData } from './../Types/types';
import { NextFunction, Request, Response } from "express";
import { OTPExpiryTime, generateVerificationOTP, hashPassword } from "../Utils/utils";
import UserRepository from "../Repositories/users";

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

        //check if unique data exist
        const [isEmailExist, isPhonenoExist, isUsernameExist] = await Promise.all([
            UserRepository.checkIfExist({email}), 
            UserRepository.checkIfExist({phoneno}), 
            username ? UserRepository.checkIfExist({username}): null
        ])

        if(isEmailExist){
            res.status(400).json({ 
                status: false, 
                message: "Account with email already exist",
                error: [],
                data: []
            });
            return;
        }

        if(isPhonenoExist){
            res.status(400).json({ 
                status: false, 
                message: "Account with phone number already exist",
                error: [],
                data: []
            });
            return;
        }

        if(isUsernameExist){
            res.status(400).json({ 
                status: false, 
                message: "Account with username already exist",
                error: [],
                data: []
            });
            return;
        }

        const newPassword = await hashPassword(password);
        const verificationOtp = generateVerificationOTP();
        const verificationOtpExpiry = new Date(Date.now() + OTPExpiryTime)
        const userData: UserData = {
            name,
            email,
            phoneno, 
            password: newPassword,
            roles: role, 
            username, 
            dob, 
            address,
            verificationOtp,
            verificationOtpExpiry
        }

        //save user 
        const save = await UserRepository.createUser(userData);
    }
}

export default UserController;