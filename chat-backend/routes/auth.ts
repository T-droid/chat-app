import { Router, Request, Response } from "express";
import { registerUser, loginUser, getUser, getPrivateUser } from "../controllers/authController";
import authmiddleware from "../middleware/authMiddleware";

const authRoutes = Router();

authRoutes
    .get('/me', (req: Request, res: Response) => {
        getUser(req, res)
    })
    .get('/users', authmiddleware, (req: Request, res: Response) => {
        getPrivateUser(req, res);
    })
    .post('/register', (req: Request, res: Response) => {
        registerUser(req, res);
    })
    .post('/login', (req: Request, res: Response) => {
        loginUser(req, res);
    })

export default authRoutes;