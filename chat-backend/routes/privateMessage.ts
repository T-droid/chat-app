import { Router, Request, Response } from "express";
import authmiddleware from "../middleware/authMiddleware";
import { getPrivateMessages } from "../controllers/privateMessagesController";

const privateMessageRoutes = Router();

privateMessageRoutes
    .get('/:recipientId', authmiddleware, (req: Request, res: Response) => {
        getPrivateMessages(req, res);
    })

export default privateMessageRoutes;