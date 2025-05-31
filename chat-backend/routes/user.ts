import { Router, Response, Request } from "express";
import { getAllUsers } from "../controllers/usersControllers";


const userRoutes = Router();

userRoutes
    .get('/', (req: Request, res: Response) => {
        getAllUsers(req, res);
    })

export default userRoutes;