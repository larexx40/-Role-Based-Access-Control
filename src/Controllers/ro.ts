import { NextFunction, Request, Response } from "express";
import { ApiError } from "../middleware/error";

class Test {
    // Add new role
    static async addTest(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                throw new ApiError(444, "Request body is required");
            }

            // Continue with processing the request
            res.status(200).json({ 
                status: false, 
                message: "Role created successfully",
                error: [],
            });
        } catch (error) {
            // Forward error to error handling middleware
            next(error);
        }
    }
}

export default Test;