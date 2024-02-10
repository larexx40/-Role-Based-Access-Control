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

class ApiError extends Error {
    statusCode: number;
    error?: string[] | string | object;
  
    constructor(statusCode: number, message: string, error?: string[]| string | object) {
      super(message);
      this.statusCode = statusCode;
      this.error = error;
    }
  }
  
  const apiErrorHandler = (
    err: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { statusCode = 500, message, error } = err;
    let errorResponse: { status: boolean, message: string, error: string[] | string | object  } = {
        status: false,
        message: message,
        error: []
      };
    
      if (error) {
        if (typeof error === 'string') {
          errorResponse.error =[error];
        } else if (Array.isArray(error)) {
          errorResponse.error = error;
        }else if (Object.keys(error).length > 0){
          errorResponse.error = error;
        }
      }
    
      res.status(statusCode).json(errorResponse);
  };
  
  
export { methodNotAllowedHandler, notFoundHandler, ApiError, apiErrorHandler };
