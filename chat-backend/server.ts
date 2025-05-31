import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';
import Message from './models/Message';

import authRoutes from './routes/auth';
import roomRoutes from './routes/room';
import { MONGODB_URI, PORT } from './config/env';
import User from './models/User';
import PrivateMessage from './models/privateMessage';
import userRoutes from './routes/user';
import privateMessageRoutes from './routes/privateMessage';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());


mongoose.connect(MONGODB_URI as string)
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.log(err));

app.use('/api/auth', authRoutes);
app.use('/api/private-messages', privateMessageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);


io.on('connection', (socket) => {
    console.log('User connected', socket.id);
    socket.on('joinRoom', (room) => {
        socket.join(room);
        socket.emit('message', { sender: 'System', content: `Welcome to ${room}!`})
    });

    socket.on('chatMessage', async ({ room, message, userId}) => {
        try{
            const user = await User.findById(userId);
            const newMessage = new Message({
                roomId: room,
                sender: userId,
                content: message
            });

            await newMessage.save();
            io.to(room).emit('message', {
                sender: user?.username,
                content: message,
                timestamp: newMessage.timestamp,
            });
        } catch (err) {
            console.log('Message error: ', err);
        }
    });

    socket.on('typing', ({ room, userId }) => {
        User.findById(userId).then(user => {
            socket.to(room).emit('typing', { username: user?.username })
        });
    })

    socket.on('stopTyping', ({ room }) => {
        socket.to(room).emit('stopTyping');
    })
    socket.on('privateMessage', async ({ recipientId, message, userId }) => {
        try {
        const user = await User.findById(userId);
        const recipient = await User.findById(recipientId);
        if (!recipient) return;
        const newMessage = new PrivateMessage({
            sender: userId,
            recipient: recipientId,
            content: message,
        });
        await newMessage.save();
        const messageData = {
            sender: { _id: user?._id, username: user?.username },
            recipient: { _id: recipient._id, username: recipient.username },
            content: message,
            timestamp: newMessage.timestamp,
        }

        io.to(userId).emit('privateMessage', messageData );
        console.log(`message ${JSON.stringify(messageData)} emmited to room ${userId}`)
        io.to(recipientId).emit('privateMessage', messageData );
        } catch (error) {
            console.error('Private message error:', error);
        }
    });

    socket.on('join', ({ userId }) => {
        socket.join(userId); 
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
    });
});

server.listen(PORT, () => console.log('Server connected and running on port ', PORT))