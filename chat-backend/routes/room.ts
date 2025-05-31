import { Router, Request, Response } from "express";
import { createRoom, getAllRooms, getRoomMessages } from "../controllers/roomController";
import authmiddleware from "../middleware/authMiddleware";


const roomRoutes = Router();

roomRoutes
    .post('/', authmiddleware, (req: Request, res: Response) => {
        createRoom(req, res);
    })
    .get('/', (req: Request, res: Response) => {
        getAllRooms(req, res);
    })
    .get('/:roomId/messages', async (req: Request, res: Response) => {
        getRoomMessages(req, res);
    })

export default roomRoutes;