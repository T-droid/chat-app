import { Request, Response } from "express";
import PrivateMessage from "../models/privateMessage";

export const getPrivateMessages = async (req: Request, res: Response) => {
    try {
    const messages = await PrivateMessage.find({
      $or: [
        { sender: req.userId, recipient: req.params.recipientId },
        { sender: req.params.recipientId, recipient: req.userId },
      ],
    })
      .populate('sender', 'username _id')
      .populate('recipient', 'username _id')
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}