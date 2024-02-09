import { AuthTokenPayload, EmailWithTemplate, UserData, UserProfile } from './../Types/types';
import { NextFunction, Request, Response } from "express";
import { OTPExpiryTime, comparePassword, generateVerificationOTP, hashPassword } from "../Utils/utils";
import UserRepository from "../Repositories/users";
import { signJwt } from '../Utils/jwt';
import mongoose from 'mongoose';
import RoleRepository from '../Repositories/roles';
import { signupValidations } from '../Validations/userValidation';
import { validationResult } from 'express-validator';
import { sendMailNM } from '../Utils/nodemailer';
import { processAndUploadImage } from '../Utils/cloudinary';
import { ApiError } from '../middleware/error';

declare module "express" {
    interface Request {
      user?: AuthTokenPayload;
    }
}

type ValidationResultError = {
    [string: string]: [string];
};
class UserController{
    static async signup(req: Request, res: Response, next: NextFunction): Promise<void>{
        // Check if the request body is empty
        if (!req.body || Object.keys(req.body).length === 0) {
            throw new ApiError(400,"Request body is required")
        }

        // Execute validation
        await Promise.all(signupValidations.map(validation => validation.run(req)));
        // Execute validation
        signupValidations.forEach((validation) => validation(req, res, () => {}));
        // Check for validation errors
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            const newError: ValidationResultError = {};
            const errors = validationErrors.array().forEach((error)=>{
            if(error.type === 'field'){
                newError[error.path]= error.msg
            }
            })
            res.status(422).json({ 
                status: false,
                message: "Validation error",
                error: newError, 
                data: []
            });
            return;
        }

        const {name, email, phoneno, password, role, username, dob, address} = req.body;
        if(!name || !phoneno || !email || !username || !password){
            throw new ApiError(400,"Pass in required fields");
        };

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
                throw new ApiError(400,"Account with phone number already exist");
            }

            if(isUsernameExist){
                throw new ApiError(400,"Account with username already exist")
                
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
            const welcomeMail : EmailWithTemplate = {
                to: userData.email,
                subject: `Welcome ${userData.name}`,
                text: "Welcome to Telytech RBAC",
                template: 'signup',
                context: {
                    name: userData.username || userData.name,
                }
            }
            sendMailNM(welcomeMail);
            //send verification otp mail
            const emailOption : EmailWithTemplate = {
                to: userData.email,
                subject: `Account Verification`,
                text: "Verify your account",
                template: 'verify-otp',
                context: {
                    username: userData.username || userData.name,
                    otp: verificationOtp
                }
            }
            sendMailNM(emailOption);

            const profileDetails: UserProfile = {
                userid: saveUser._id,
                name: saveUser.name,
                username: saveUser.username,
                email: saveUser.email,
                phoneno: saveUser.phoneno,
                dob: saveUser.dob,
                address: saveUser.address,
                roles: saveUser.roles,
                status: saveUser.status,
                isEmailVerified: saveUser.isEmailVerified,
                isPhoneVerified: saveUser.isPhoneVerified,
                mfaEnabled: saveUser.mfaEnabled,
                createdAt: saveUser.createdAt,
                updatedAt: saveUser.updatedAt,
            }
            res.status(201).json({
                status: true,
                message: "User registration successful",
                data: {
                    user: profileDetails,
                    authToken: jwtToken,
                }
            });
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                // Mongoose validation error
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                throw new ApiError(400,"Invalid data passed", validationErrors)
                throw new ApiError(400,"")
                throw new ApiError(400,"Invalid data passed", validationErrors);
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
            throw new ApiError(400,"Request body is required");
        }

        const {email, password} = req.body;
        if(!email || !password){
            throw new ApiError(400,"Pass in required fields");
        }
        

        try {
            //get user
            const user = await UserRepository.getUser({email});            
            if(!user){
                throw new ApiError(400,"Invalid email and or password")
            }
            //compare password
            const hashedPassword: string | undefined = user?.password;
            const isMatch = comparePassword(password, hashedPassword)
            if(!isMatch){
                throw new ApiError(400,"Incorrect password")
            }
           

            const profileDetails: UserProfile = {
                userid: user._id,
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
                // if(updateVerificationDetails){
                //     //send mail via nodemailer and likes
                // }

                //generate fast jwt token
                const jwtToken = signJwt(authPayload,{},'1h')
                throw new ApiError(400,"Login successfull, check your email for verification OTP")
            }

            //check if mfa is enabled
            if(user.mfaEnabled){
                //generate new mfa and save to db
                const mfaSecret = generateVerificationOTP();
                const mfaSecretExpiry = new Date(Date.now() + OTPExpiryTime)
                //update user otp details
                const updateFields: Partial<UserData> ={
                    mfaSecret,
                    mfaSecretExpiry,
                }
                const newUser = UserRepository.updateUser(user._id, updateFields);
                //send OTP as mail or sms
                //send email or sms
                const mailDetails: EmailWithTemplate ={
                    to: user.email,
                    subject: `MFA Verification Token`,
                    text: `Use this OTP: ${mfaSecret} to complete your action`,
                    template: 'mfa',
                    context: {
                        username: user.username || user.name,
                        mfaToken: mfaSecret
                    }
                }
                const mfaType = user.mfaType;
                const sendOTP = (mfaType === "EMAIL" )? sendMailNM(mailDetails): '';

                //send fast token
                const jwtToken = signJwt(authPayload,{},'1h')
                res.status(200).json({ 
                    status: true, 
                    message: (mfaType === 'EMAIL') ? "Login successfull, check your email for verification OTP" : "Login successfull, check your phone SMS for verification OTP",
                    error: [],
                    data: {
                        user: profileDetails,
                        authToken: jwtToken
                    }
                });
                return;
            }
            const jwtToken = signJwt(authPayload,{},'1d')
            res.status(200).json({ 
                status: false, 
                message: "Login successfull",
                error: [],
                data: {
                    user: profileDetails,
                    authToken: jwtToken
                }
            });
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                // Mongoose validation error
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                throw new ApiError(400,"Invalid data passed", validationErrors);
            }
            throw new ApiError(400,"Internal server error")
            console.error(error);
        }
    }

    static async verifyPhoneno(req: Request, res: Response, next: NextFunction): Promise<void>{
        if (!req.body || Object.keys(req.body).length === 0) {
            throw new ApiError(400,"Request body is required")
            
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
             
        try {
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
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                // Mongoose validation error
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                throw new ApiError(400,"Invalid data passed", validationErrors);
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

    static async verifyMail(req: Request, res: Response, next: NextFunction): Promise<void>{
        if (!req.body || Object.keys(req.body).length === 0) {
            throw new ApiError(400,"Request body is required")
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
        try {
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
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                // Mongoose validation error
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                throw new ApiError(400,"Invalid data passed", validationErrors);
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
    //resendOTP
    static async resendVerifyOTP(req: Request, res: Response, next: NextFunction): Promise<void>{
        if(!req.params){
            throw new ApiError(400,"Pass all required field")
            
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
        try {
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
            if(type === "email"){
                const emailOption : EmailWithTemplate = {
                    to: user.email,
                    subject: `Account Verification`,
                    text: "Verify your account",
                    template: 'verify-otp',
                    context: {
                        username: user.username || user.name,
                        otp: verificationOtp
                    }
                }
                sendMailNM(emailOption);
            }
            res.status(200).json({ 
                status: true, 
                message: (type === 'email' ) ?"Verification token sent to your mail": "Verification token sent to your phone",
                error: [],
                data: []
            });
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                // Mongoose validation error
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                throw new ApiError(400,"Invalid data passed", validationErrors);
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
    //enable mfa
    static async enableMFA(req: Request, res: Response, next: NextFunction): Promise<void>{
        
        let mfaType = req.query.type as string;
        if(!mfaType){
            throw new ApiError(400,"Pass all required field")
        }
        mfaType = mfaType.toUpperCase();
        if(mfaType !== 'EMAIL' && mfaType != "SMS" ){
            throw new ApiError(400,"Invalid MFA type passed")
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

        try {
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
                message: `${mfaType} MFA enabled successful`,
                error: [],
                data: []
            });
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                // Mongoose validation error
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                throw new ApiError(400,"Invalid data passed", validationErrors);
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

        try {
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
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                // Mongoose validation error
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                throw new ApiError(400,"Invalid data passed", validationErrors);
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
    //verifymfatoken
    static async verifyMFAToken(req: Request, res: Response, next: NextFunction): Promise<void>{
        if (!req.body || Object.keys(req.body).length === 0) {
            throw new ApiError(400,"Request body is required")
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

        try {
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
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                // Mongoose validation error
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                throw new ApiError(400,"Invalid data passed", validationErrors);
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
        try {
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
            const mailDetails: EmailWithTemplate ={
                to: user.email,
                subject: `MFA Verification Token`,
                text: `Use this OTP: ${mfaSecret} to complete your action`,
                template: 'mfa',
                context: {
                    username: user.username || user.name,
                    mfaToken: mfaSecret
                }
            }
            const sendOTP = (mfaType === "EMAIL" )? sendMailNM(mailDetails): '';
            res.status(200).json({ 
                status: true, 
                message: (mfaType === 'EMAIL' ) ?"Verification token sent to your mail": "Verification token sent to your phone",
                error: [],
                data: []
            });
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                // Mongoose validation error
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                throw new ApiError(400,"Invalid data passed", validationErrors);
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

    //assignRole
    static async assignRoleToUser(req: Request, res: Response, next:NextFunction): Promise<void>{
        if (!req.body || Object.keys(req.body).length === 0) {
            throw new ApiError(400,"Request body is required")
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

        try {
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
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                // Mongoose validation error
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                throw new ApiError(400,"Invalid data passed", validationErrors);
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

    //remove role
    static async removeUserRole(req: Request, res: Response, next:NextFunction): Promise<void>{
        if (!req.body || Object.keys(req.body).length === 0) {
            throw new ApiError(400,"Request body is required")
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
        try {
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
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                // Mongoose validation error
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                throw new ApiError(400,"Invalid data passed", validationErrors);
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

    //get details
    static async getDetails(req: Request, res: Response, next: NextFunction): Promise<void>{
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
        try {
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

            const profileDetails: UserProfile = {
                userid: user._id,
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
            res.status(200).json({ 
                status: true, 
                message: "Profile fetched",
                error: [],
                data: profileDetails
            }); 
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                // Mongoose validation error
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                throw new ApiError(400,"Invalid data passed", validationErrors);
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

    static async uploadProfilePic(req: Request, res: Response, next: NextFunction): Promise<void>{

        if(!req.user){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }
        
        // if (!req.file) {
        //     res.status(400).json({ 
        //         status: false, 
        //         message: 'No file uploaded',
        //         error: [] ,
        //         data: []
        //     });
        //     return;
        // }

        const {email} = req.user;
             
        try {
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
            const profilePicUrl = await processAndUploadImage(req);
            console.log(profilePicUrl);
        
            //update user otp details
            const updateFields: Partial<UserData> ={
                profilePic: profilePicUrl
            }

            const newUser = UserRepository.updateUser(user._id, updateFields);
            res.status(200).json({ 
                status: true, 
                message: "Profile updated",
                error: [],
                data: []
            });
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                // Mongoose validation error
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                throw new ApiError(400,"Invalid data passed", validationErrors);
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