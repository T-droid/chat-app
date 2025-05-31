import jwt from 'jsonwebtoken';
import { JWT_SECRET } from "../config/env";
import { Request, Response } from 'express';

declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}



import { NextFunction } from "express";

const authmiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const { authorization } = req.headers;
    const token = authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'No token provide' });
        return;
    }

    try {
        const decoded: jwt.JwtPayload | string = jwt.verify(token as string, JWT_SECRET as string);
        req.userId = (decoded as jwt.JwtPayload)?.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token'});
    }
}

export default authmiddleware;