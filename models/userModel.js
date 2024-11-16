import { Schema, model } from "mongoose"


const UserModel = new Schema({
    name: { type: String, required: false },
    city: { type: String, required: false },
    age: { type: Number, required: false },
    phone: { type: String, required: false },
    dateOfBirth: { type: Date, required: false },
    email: { type: String, required: true },
    gender: { type: String, enum: ["Ж", "М"], required: false },
    passwordHash: { type: String, required: true },
    chats: [{ type: Schema.Types.ObjectId, ref: 'Chat' }]
}, { timestamps: true });


export default model('User', UserModel, 'User');