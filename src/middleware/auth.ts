import dotenv from 'dotenv';
import jwt,  { SignOptions} from 'jsonwebtoken';
import { NextFunction, Request, Response } from "express";
const { TokenExpiredError } = jwt;
import { AuthTokenPayload } from '../Types/types';
dotenv.config();

declare module "express" {
    interface Request {
      user?: AuthTokenPayload;
    }
}

export const checkToken = (req: any, res: any, next: any) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ 
            status: false,
            message: "Unauthorized",
            error: ['No authourization token provided'] ,
            data:[]
        });
    }
    //work if frefix bearer exist or not
    let token : string = req.headers.authorization;
    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    try {
        //then decode the jwt token
        const decodeToken = jwt.verify(token, process.env.JWT_SECRET!) as AuthTokenPayload;    
        // check if token is valid
        if (!decodeToken) {
            return res.status(401).json({ 
                status: false,
                message: "Unauthorized",
                error: ['Invalid token'] ,
                data: []
            });
        }
        // const expiry = decodeToken.exp;
        console.log(decodeToken);    
        req.user = decodeToken;
        next();
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            return res.status(401).json({ 
                status: false,
                message: "Unauthorized",
                error: ['Token expired'] ,
                data: []
        });;
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ 
                status: false, 
                message: "Unauthorized",
                error: ['Invalid token error'],
                data:[]
             });
        }
        console.log(error);
        return res.status(500).json({ 
            status: false, 
            message: "Unauthorized",
            error: ['Invalid token'],
            data: [] 
        });
        
    }
}

export const isAdmin = (req: Request, res: Response, next: NextFunction)=>{
    if (!req.user) {
        res.status(400).json({ 
            status: false, 
            message: "Unauthorized",
            error: ["User not authenticated", 'Pass in bearer token'],

        });
        return;
    }
    const roles = req.user.roles
    
    if (!roles?.includes('Admin') && !roles?.includes('Super Admin')){
        res
          .status(400).json({ 
            status: false, 
            message: "User not authourise to access this route",
            error: ['No right access to perform this operation', 'You are not assigned role to access this endpoint']
        });
        return;
    }
    next();
}

export const isUser = (req: Request, res: Response, next: NextFunction)=>{
    if (!req.user) {
        res.status(400).json({ 
            status: false, 
            message: "Unauthorized",
            error: ["User not authenticated", 'Pass in bearer token'],

        });
        return
    }
    const roles = req.user.roles
    if (roles?.includes('User')){ 
        res.status(400).json({ 
            status: false, 
            message: "User not authourise to access this route",
            error: ['No right access to perform this operation', 'You are not assigned role to access this endpoint']
        });
        return;
    }
    next();
}
