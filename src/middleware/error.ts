import { Request, Response, NextFunction } from 'express';

const methodNotAllowedHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const error = new Error(`Method Not Allowed - ${req.method}`);
    res.status(405).json({
        status: false,
        message: error.message,
        error: ['Invalid HTTP method', `${req.method} is not allowed on this route: ${req.originalUrl}`],
        data: []
    });
    next(error);
};
  
const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404).json({
        status: false,
        message: error.message,
        error: [],
        data: []
    });
    next(error);
};
  
export { methodNotAllowedHandler, notFoundHandler };
