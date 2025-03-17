import { NextFunction, Request, Response } from 'express';

// example of a middleware function that will be used for user requests
const timeMiddleware = (_request: Request, _response: Response, next: NextFunction) => {
    console.log(`Request made at ${new Date().toISOString()}`);

    next();
};

export { timeMiddleware };