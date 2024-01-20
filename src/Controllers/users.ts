import { AuthTokenPayload, UserData } from './../Types/types';
import { NextFunction, Request, Response } from "express";
import { OTPExpiryTime, generateVerificationOTP, hashPassword } from "../Utils/utils";
import UserRepository from "../Repositories/users";
import { signJwt } from '../Utils/jwt';
import mongoose from 'mongoose';

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

        try {
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
            const saveUser = await UserRepository.createUser(userData);
            const jwtPayload: AuthTokenPayload ={
                userid: saveUser._id,
                email: email,
                roles: role 
            } 
            const jwtToken = signJwt(jwtPayload)
            //send welcome mail
            //send verification otp mail

            res.status(201).json({
                status: true,
                message: "User registration successful",
                data: saveUser,
                authToken: jwtToken,
            });
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                // Mongoose validation error
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                res.status(400).json({ 
                    status: false,
                    message: "Invalid data passed",
                    error: validationErrors,
                    data:[]
                });
            }
            res.status(500).json({ 
                status: false, 
                message: "Internal server error",
                error: [],
                data: []
            });
            console.error(error);
        }

    }

    
}

export default UserController;