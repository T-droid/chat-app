import mongoose from "mongoose";

const privetMessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

const PrivateMessage = mongoose.model('PrivateMessage', privetMessageSchema);

export default PrivateMessage;