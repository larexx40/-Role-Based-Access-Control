import { AuthTokenPayload, UserData, UserProfile } from './../Types/types';
import { NextFunction, Request, Response } from "express";
import { OTPExpiryTime, comparePassword, generateVerificationOTP, hashPassword } from "../Utils/utils";
import UserRepository from "../Repositories/users";
import { signJwt } from '../Utils/jwt';
import mongoose from 'mongoose';
import { IUserDocument } from '../Models/users';
import RoleRepository from '../Repositories/roles';

declare module "express" {
    interface Request {
      user?: AuthTokenPayload;
    }
}
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

    static async login(req: Request, res: Response, next: NextFunction): Promise<void>{
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

        const {email, password} = req.body;
        if(!email || !password){
            res.status(400).json({ 
                status: false, 
                message: "Pass in the required fields",
                error: [],
                data: []
            });
            return;
        }

        try {
            //get user
            const user = await UserRepository.getUser({email});
            if(!user){
                res.status(400).json({ 
                    status: false, 
                    message: "Invalid email and or password",
                    error: [],
                    data: []
                });
                return;
            }
            //compare password
            const hashedPassword: string | undefined = user?.password;
            const isMatch = comparePassword(password, hashedPassword)
            if(!isMatch){
                res.status(400).json({ 
                    status: false, 
                    message: "Incorrect password",
                    error: [],
                    data: []
                });
                return;
            }

            const profileDetails: UserProfile = {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                phoneno: user.phoneno,
                dob: user.dob,
                address: user.address,
                roles: user.roles,
                status: user.status,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified,
                mfaEnabled: user.mfaEnabled,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }
            const authPayload: AuthTokenPayload={
                userid: user._id,
                email,
                roles: user?.roles
            }

            //check if email is verified
            if(!user?.isEmailVerified){
                //send verification otp // use fast jwt token 1h
                const verificationOtp = generateVerificationOTP();
                const verificationOtpExpiry = new Date(Date.now() + OTPExpiryTime)
                //update otp and expiry time
                const updateVerificationDetails = await UserRepository.updateUser(user._id, {verificationOtp, verificationOtpExpiry});
                //send mail
                if(updateVerificationDetails){
                    //send mail via nodemailer and likes
                }

                //generate fast jwt token
                const jwtToken = signJwt(authPayload,{},'1h')
                res.status(400).json({ 
                    status: false, 
                    message: "Login successfull, check your email for verification OTP",
                    error: [],
                    data: {
                        user: profileDetails,
                        authToken: jwtToken
                    }
                });
                return;
            }

            //check if mfa is enabled
            if(user.mfaEnabled){
                //send OTP as mail or sms
                const mfaType = user.mfaType;
                // const sendOTP = (mfaType === 'Email')? sendEmail() : ((mfaType === 'SMS')? sendSMS(): null);

                //send fast token
                const jwtToken = signJwt(authPayload,{},'1h')
                res.status(200).json({ 
                    status: true, 
                    message: (mfaType === 'Email') ? "Login successfull, check your email for verification OTP" : "Login successfull, check your phone SMS for verification OTP",
                    error: [],
                    data: {
                        user: profileDetails,
                        authToken: jwtToken
                    }
                });
                return;
            }
            const jwtToken = signJwt(authPayload,{},'1d')
            res.status(400).json({ 
                status: false, 
                message: "Login successfull",
                error: [],
                data: {
                    user: profileDetails,
                    authToken: jwtToken
                }
            });
        } catch (error) {
            
        }
    }

    static async verifyPhoneno(req: Request, res: Response, next: NextFunction): Promise<void>{
        if (!req.body || Object.keys(req.body).length === 0) {
            res.status(400).json({ 
                status: false, 
                message: "Request body is required",
                error: [],
                data: []
            });
            return;
        }

        const {otp} = req.body;
        if(!otp){
            res.status(400).json({ 
                status: false, 
                message: "Pass in verification token",
                error: [],
                data: []
            });
            return;
        }

        if(!req.user){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }

        const {email} = req.user;

        //get user with email
        let user = await UserRepository.getUser({email});
        if(!user){
            res.status(400).json({ 
                status: false, 
                message: "Invalid user",
                error: [],
                data: []
            });
            return;
        }
        //compare token and expiry time
        if(otp != user?.verificationOtp){
            res.status(400).json({ 
                status: false, 
                message: "Invalid verification token",
                error: [],
                data: []
            });
            return;
        }

        if(user?.verificationOtpExpiry && new Date() > user.verificationOtpExpiry){
            res.status(400).json({ 
                status: false, 
                message: "Token expired",
                error: [],
                data: []
            });
            return;
        }
        //update user otp details
        const updateFields: Partial<UserData> ={
            isPhoneVerified: true,
            verificationOtp: '',
            verificationOtpExpiry: '',
        }

        const newUser = UserRepository.updateUser(user._id, updateFields);
        res.status(200).json({ 
            status: true, 
            message: "Phone number verified",
            error: [],
            data: []
        });
                

    }

    static async verifyMail(req: Request, res: Response, next: NextFunction): Promise<void>{
        if (!req.body || Object.keys(req.body).length === 0) {
            res.status(400).json({ 
                status: false, 
                message: "Request body is required",
                error: [],
                data: []
            });
            return;
        }

        const {otp} = req.body;
        if(!otp){
            res.status(400).json({ 
                status: false, 
                message: "Pass in verification token",
                error: [],
                data: []
            });
            return;
        }

        if(!req.user){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }

        const {email} = req.user;

        //get user with email
        let user = await UserRepository.getUser({email});
        if(!user){
            res.status(400).json({ 
                status: false, 
                message: "Invalid user",
                error: [],
                data: []
            });
            return;
        }
        //compare token and expiry time
        if(otp != user?.verificationOtp){
            res.status(400).json({ 
                status: false, 
                message: "Invalid verification token",
                error: [],
                data: []
            });
            return;
        }

        if(user?.verificationOtpExpiry && new Date() > user.verificationOtpExpiry){
            res.status(400).json({ 
                status: false, 
                message: "Token expired",
                error: [],
                data: []
            });
            return;
        }
        //update user otp details
        const updateFields: Partial<UserData> ={
            isEmailVerified: true,
            verificationOtp: '',
            verificationOtpExpiry: '',
        }

        const newUser = UserRepository.updateUser(user._id, updateFields);
        res.status(200).json({ 
            status: true, 
            message: "Email verified",
            error: [],
            data: []
        });
                

    }
    //resendOTP
    static async resendVerifyOTP(req: Request, res: Response, next: NextFunction): Promise<void>{
        if(!req.params){
            res.status(400).json({ 
                status: false, 
                message: "Pass all required field",
                error: [],
                data: []
            });
            return;
        }

        // Passing query =====> GET request to "/car/honda?color=blue"
        const {type} = req.query;
        if(type !== 'email' && type !== 'phone'){
            res.status(400).json({ 
                status: false, 
                message: "Verification type can only be email or phone number",
                error: [],
                data: []
            });
            return;
        }

        if(!req.user){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }

        const {email} = req.user;
        //get user with email
        let user = await UserRepository.getUser({email});
        if(!user){
            res.status(400).json({ 
                status: false, 
                message: "Invalid user",
                error: [],
                data: []
            });
            return;
        }

        //update new detail
        const verificationOtp = generateVerificationOTP();
        const verificationOtpExpiry = new Date(Date.now() + OTPExpiryTime)
        //update user otp details
        const updateFields: Partial<UserData> ={
            verificationOtp,
            verificationOtpExpiry,
        }
        const newUser = UserRepository.updateUser(user._id, updateFields);
        //send email or sms
        // const sendOTP = (type === 'email')? sendEmail() : sendSMS();
        res.status(200).json({ 
            status: true, 
            message: (type === 'email' ) ?"Verification token sent to your mail": "Verification token sent to your phone",
            error: [],
            data: []
        });


               
    }
    //enable mfa
    static async enableMFA(req: Request, res: Response, next: NextFunction): Promise<void>{
        if (!req.body || Object.keys(req.body).length === 0) {
            res.status(400).json({ 
                status: false, 
                message: "Request body is required",
                error: [],
                data: []
            });
            return;
        }
        const {mfaType} = req.body;
        if(!mfaType){
            res.status(400).json({ 
                status: false, 
                message: "Pass all required field",
                error: [],
                data: []
            });
            return;
        }
        if(mfaType !== 'Email' || mfaType !== 'SMS'){
            res.status(400).json({ 
                status: false, 
                message: "Invalid MFA type passed",
                error: [],
                data: []
            });
            return;
        }
        if(!req.user){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }

        const {email} = req.user;
        //get user with email
        let user = await UserRepository.getUser({email});
        if(!user){
            res.status(400).json({ 
                status: false, 
                message: "Invalid user",
                error: [],
                data: []
            });
            return;
        } 

        //confirm if email or phone verified
        if(!user.isEmailVerified || !user.isPhoneVerified){
            res.status(400).json({ 
                status: false, 
                message: "Verify your email and or phone number to enable MFA",
                error: [],
                data: []
            });
            return;
        }

        const updateFields: Partial<UserData> ={
            mfaEnabled: true,
            mfaType: mfaType
        }
        const newUser = UserRepository.updateUser(user._id, updateFields);
        res.status(200).json({ 
            status: true, 
            message: "MFA enabled successful",
            error: [],
            data: []
        });

    }
    //disable mfa
    static async disableMFA(req: Request, res:Response, next: NextFunction): Promise<void>{
        if(!req.user){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }

        const {email} = req.user;
        //get user with email
        let user = await UserRepository.getUser({email});
        if(!user){
            res.status(400).json({ 
                status: false, 
                message: "Invalid user",
                error: [],
                data: []
            });
            return;
        } 

        
        const updateFields: Partial<UserData> ={
            mfaEnabled: false,
            mfaType: '',
            mfaSecret: '',
        }
        const newUser = UserRepository.updateUser(user._id, updateFields);
        res.status(200).json({ 
            status: true, 
            message: "MFA disabled successful",
            error: [],
            data: []
        });
    }
    //verifymfatoken
    static async verifyMFAToken(req: Request, res: Response, next: NextFunction): Promise<void>{
        if (!req.body || Object.keys(req.body).length === 0) {
            res.status(400).json({ 
                status: false, 
                message: "Request body is required",
                error: [],
                data: []
            });
            return;
        }

        const {otp} = req.body;
        if(!otp){
            res.status(400).json({ 
                status: false, 
                message: "Pass in verification token",
                error: [],
                data: []
            });
            return;
        }

        if(!req.user){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }

        const {email} = req.user;

        //get user with email
        let user = await UserRepository.getUser({email});
        if(!user){
            res.status(400).json({ 
                status: false, 
                message: "Invalid user",
                error: [],
                data: []
            });
            return;
        }
        //compare token and expiry time
        if(otp != user?.mfaSecret){
            res.status(400).json({ 
                status: false, 
                message: "Invalid verification token",
                error: [],
                data: []
            });
            return;
        }

        if(user?.mfaSecretExpiry && new Date() > user.mfaSecretExpiry){
            res.status(400).json({ 
                status: false, 
                message: "Token expired",
                error: [],
                data: []
            });
            return;
        }
        res.status(200).json({ 
            status: true, 
            message: "MFA verified",
            error: [],
            data: []
        });
                

    }
    //resentMfaOtp
    static async resendMFAOTP(req: Request, res: Response, next: NextFunction): Promise<void>{
        if(!req.user){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }

        const {email} = req.user;
        //get user with email
        let user = await UserRepository.getUser({email});
        if(!user){
            res.status(400).json({ 
                status: false, 
                message: "Invalid user",
                error: [],
                data: []
            });
            return;
        }

        //confirm if mfa is enabled
        if(!user.mfaEnabled){
            res.status(400).json({ 
                status: false, 
                message: "Enable MFA to access this endpoint",
                error: [],
                data: []
            });
            return;
        }

        const mfaType = user.mfaType
        if(!mfaType){
            res.status(400).json({ 
                status: false, 
                message: "Set your MFA type",
                error: [],
                data: []
            });
            return;
        }

        //update new detail
        const mfaSecret = generateVerificationOTP();
        const mfaSecretExpiry = new Date(Date.now() + OTPExpiryTime)
        //update user otp details
        const updateFields: Partial<UserData> ={
            mfaSecret,
            mfaSecretExpiry,
        }
        const newUser = UserRepository.updateUser(user._id, updateFields);
        //send email or sms
        // const sendOTP = (mfaType === 'email')? sendEmail() : sendSMS();
        res.status(200).json({ 
            status: true, 
            message: (mfaType === 'Email' ) ?"Verification token sent to your mail": "Verification token sent to your phone",
            error: [],
            data: []
        });


               
    }

    //assignRole
    static async assignRoleToUser(req: Request, res: Response, next:NextFunction): Promise<void>{
        if (!req.body || Object.keys(req.body).length === 0) {
            res.status(400).json({ 
                status: false, 
                message: "Request body is required",
                error: [],
                data: []
            });
            return;
        }

        const {userId, roleId} = req.body;
        if(!userId || !roleId){
            res.status(400).json({ 
                status: false, 
                message: "Pass in the required field",
                error: [],
                data: []
            });
            return;
        }

        if(!req.user){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }

        const {roles} = req.user;
        if (!roles?.includes('Admin')){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }

        //get user with id and assign the role
        const [user, role] = await Promise.all([
            UserRepository.getUser({ _id: userId }),
            RoleRepository.getRole ({_id: roleId}),
        ]);

        if(!user){
            res.status(404).json({ 
                status: false, 
                message: "User not found",
                error: [],
                data: []
            });
            return;
        }

        if(!role){
            res.status(404).json({ 
                status: false, 
                message: "Role not found",
                error: [],
                data: []
            });
            return;
        }

        //update the role
        const roleName = role.name;
        const updateUserRole = await UserRepository.updateUserRoles(userId, roleName);
        res.status(200).json({ 
            status: true, 
            message: "Role updated successfully",
            error: [],
            data: []
        });
    }

    //remove role
    static async removeUserRole(req: Request, res: Response, next:NextFunction): Promise<void>{
        if (!req.body || Object.keys(req.body).length === 0) {
            res.status(400).json({ 
                status: false, 
                message: "Request body is required",
                error: [],
                data: []
            });
            return;
        }

        const {userId, roleId} = req.body;
        if(!userId || !roleId){
            res.status(400).json({ 
                status: false, 
                message: "Pass in the required field",
                error: [],
                data: []
            });
            return;
        }

        if(!req.user){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }

        const {roles} = req.user;
        if (!roles?.includes('Admin')){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }

        //get user with id and assign the role
        const [user, role] = await Promise.all([
            UserRepository.getUser({ _id: userId }),
            RoleRepository.getRole ({_id: roleId}),
        ]);

        if(!user){
            res.status(404).json({ 
                status: false, 
                message: "User not found",
                error: [],
                data: []
            });
            return;
        }

        if(!role){
            res.status(404).json({ 
                status: false, 
                message: "Role not found",
                error: [],
                data: []
            });
            return;
        }

        //update the role
    }
    
}

export default UserController;