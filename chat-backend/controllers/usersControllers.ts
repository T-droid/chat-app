import { Request, Response } from "express";
import User from "../models/User";


export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({}).select('_id username');
        return res.json({ users });
    } catch (error) {
        return res.status(500).json({ message: "Server error"});        
    }
}