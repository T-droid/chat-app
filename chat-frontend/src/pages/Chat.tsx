import React, { useState, useEffect, useContext } from "react";
import { AuthContext,type AuthContextType } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

interface ChatUser {
  _id: string;
  username: string;
}

interface Message {
  sender: string | { username: string };
  content: string;
  timestamp: string;
}

interface Room {
  _id: string;
  name: string;
}

const Chat = () => {
    const { user, logout } = useContext(AuthContext) as AuthContextType;
    const navigate = useNavigate();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [currentRoom, setCurrentRoom] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState('');
    const [newRoom, setNewRoom] = useState('');
    const [typing, setTyping] = useState(null); // For typing indicator    
    const [users, setUsers] = useState<ChatUser[]>([]); // For private messaging
    const [currentRecipient, setCurrentRecipient] = useState<string | null>(null); // For private messaging
    const [privateMessages, setPrivateMessages] = useState<Message[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) navigate('/login');

        axios.get('http://localhost:3000/api/rooms').then(res => setRooms(res.data.rooms))
        axios.get('http://localhost:3000/api/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }).then(res => setUsers(res.data.users));

        socket.emit('join', { user: user?.id});

        socket.on('message', (msg) => {
            setMessages((prev) => [...prev, msg])
        });

        socket.on('typing', ({ username }) => {
          setTyping(username);
        });

        socket.on('stopTyping', () => {
          setTyping(null);
        });

        socket.on('privateMessage', (msg) => {
          setPrivateMessages((prev) => {
            if (
              (msg.sender._id === user?.id && msg.recipient._id === currentRecipient) ||
              (msg.recipient._id === user?.id && msg.sender._id === currentRecipient)
            ) {
              return [...prev, msg]
            }
            return prev;
          })
        })

        return () => {
          socket.off('message');
          socket.off('typing');
          socket.off('stopTyping');
          socket.off('privateMessage');
        };
    }, [user?.id, currentRecipient])


    useEffect(() => {
      if (user?.id) {
        socket.emit('join', { userId: user.id });
      }
    }, [user?.id])
        

    const joinRoom = async (room: string) => {
        setCurrentRoom(room);
        setCurrentRecipient(null);
        socket.emit('joinRoom', room);
        const res = await axios.get<Message[]>(`http://localhost:3000/api/rooms/${room}/messages`)
        setMessages(res.data);
        setPrivateMessages([]);
    }

    const sendMessage = (e: React.FormEvent<HTMLElement>) => {
        e.preventDefault();

        if (message.trim()) {
            socket.emit('chatMessage', { room: currentRoom, message, userId: user?.id });
            setMessage('');
            socket.emit('stopTyping', { room: currentRoom })
        }
    }

    const handleTyping = () => {
      if (currentRoom) {
        socket.emit('typing', { room: currentRoom, userId: user?.id })
      }
    }

    const handleStopTyping = () => {
      if (currentRoom) {
        socket.emit('stopTyping', { room: currentRoom })
      }
    }

    const createRoom = async (e: React.FormEvent<HTMLElement>) => {
      e.preventDefault();
      if (newRoom.trim()) {
        await axios.post(
          'http://localhost:3000/api/rooms',
          { name: newRoom },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`}}
        )
        .then(res => setRooms([...rooms, res.data.room]) )
        setNewRoom('');
      }
    }

    const startPrivateChat = async (recipientId: string) => {
      setCurrentRecipient(recipientId);
      setCurrentRoom(null);
      const res = await axios.get(`http://localhost:3000/api/private-messages/${recipientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`}
      });
      setPrivateMessages(res.data);
      setMessages([]);
    }

    const sendPrivateMessage = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (message.trim() && currentRecipient) {
        socket.emit('privateMessage', { recipientId: currentRecipient, message, userId: user?.id })
        console.log(`User send message ${message}`)
        setMessage('');
      }
    }

    return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/4 bg-white p-4 border-r">
        <h2 className="text-xl mb-4">Rooms</h2>
        <form onSubmit={createRoom} className="mb-4">
          <input
            type="text"
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
            placeholder="New room name"
            className="w-full p-2 border rounded"
          />
          <button type="submit" className="w-full p-2 mt-2 bg-green-500 text-white rounded">
            Create Room
          </button>
        </form>
        <ul>
          {rooms.length !== 0 && rooms.map((room: Room) => (
            <li
              key={room._id}
              onClick={() => joinRoom(room.name)}
              className={`p-2 cursor-pointer ${currentRoom === room.name ? 'bg-blue-100' : ''}`}
            >
              {room.name}
            </li>
          ))}
        </ul>
        <h2 className="text-xl mt-4 mb-2">Users</h2>
        <ul>
          {users
            .filter((u) => u._id !== user?.id)
            .map((u) => (
              <li
                key={u._id}
                onClick={() => startPrivateChat(u._id)}
                className={`p-2 cursor-pointer ${currentRecipient === u._id ? 'bg-blue-100' : ''}`}
              >
                {u.username}
              </li>
            ))}
        </ul>
        <button
          onClick={logout}
          className="w-full p-2 mt-4 bg-red-500 text-white rounded"
        >
          Logout
        </button>
      </div>
      <div className="w-3/4 p-4">
        {currentRoom || currentRecipient ? (
          <>
            <h2 className="text-2xl mb-4">
              {currentRoom ? `${currentRoom} Chat` : `Chat with ${users.find(u => u._id === currentRecipient)?.username}`}
            </h2>
            {typing && currentRoom && <p className="text-gray-500">{typing} is typing...</p>}
            <div className="h-3/4 overflow-y-auto border p-4 mb-4">
              {(currentRoom ? messages : privateMessages).map((msg, index) => (
                <div key={index} className="mb-2">
                  <strong>
                    {typeof msg.sender === 'object'
                      ? msg.sender.username
                      : msg.sender}
                    :
                  </strong>{" "} {msg.content} <span className="text-gray-500 text-sm">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
            <form onSubmit={currentRoom ? sendMessage : sendPrivateMessage} className="flex">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={currentRoom ? handleTyping : undefined}
                onKeyUp={currentRoom ? handleStopTyping : undefined}
                className="flex-1 p-2 border rounded-l"
                placeholder="Type a message..."
              />
              <button type="submit" className="p-2 bg-blue-500 text-white rounded-r">
                Send
              </button>
            </form>
          </>
        ) : (
          <p className="text-center mt-10">Select a room or user to start chatting</p>
        )}
      </div>
    </div>
  );
}

export default Chat;

