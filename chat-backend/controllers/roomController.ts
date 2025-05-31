import { Request, Response } from "express";
import Room from "../models/Room";
import Message from "../models/Message";

export const createRoom = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Room name is required' });

        const existingRoom = await Room.findOne({ name });
        if (existingRoom) return res.status(400).json({ message: 'Room already exists' });
        const room = new Room({ name, createdBy: req.userId });
        await room.save();
        res.status(201).json({ room: { _id: room._id, name: room.name } });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

export const getAllRooms = async (req: Request, res: Response) => {
    try {
        const rooms = await Room.find().select('name');
        res.json({ rooms })
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
}

export const getRoomMessages = async (req: Request, res: Response) => {
    try {
    const room = await Room.findOne({ name: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    const messages = await Message.find({ roomId: room.name })
      .populate('sender', 'username')
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}