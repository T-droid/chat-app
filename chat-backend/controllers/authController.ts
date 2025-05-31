import User from "../models/User";
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { JWT_SECRET } from "../config/env";


export const getUser = async (req: Request, res: Response) => {
    try {
        const { authorization } = req.headers
        const token = authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: "Unauthorized" });
    
        try{
            var decoded = jwt.verify(token as string, JWT_SECRET as string)
        } catch (err) {
            return res.status(500).json({ message: "Server error"})
        }

        let userId: string | undefined;
        if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
            userId = (decoded as jwt.JwtPayload).userId as string;
        }

        if (!userId) return res.status(401).json({ message: "Unaothorised"});

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found"});

        return res.json({ user: { id: user._id, username: user.username, email: user.email }})
    } catch (error) {
        return res.status(500).json({ message: "Server error"});
    }
}

export const getPrivateUser = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('username _id');
        res.json(users)
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required'});
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists'});
        }

        const user = new User({ username, email, password });
        await user.save();

        const token = jwt.sign({ userId: user._id }, JWT_SECRET as string, { expiresIn: '1h'});
        res.status(201).json({ token, user: { id: user._id, username, email } })
    } catch (err) {
        res.status(500).json({ message: 'Server error'})
    }
}

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid Credentials'});
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET as string, { expiresIn: '1hr' });
        res.json({ token, user: { id: user._id, username: user.username, email }})
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}