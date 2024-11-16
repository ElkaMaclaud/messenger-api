import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import UserModel from "../models/userModel.js"
import ChatModel from "../models/chatModel.js"
import dotenv from "dotenv"
import { UnauthorizedException } from "../errors/UnauthorizedException.js"
import { USER_NOT_FOUND_ERROR, WRONG_PASSWORD_ERROR } from "../constants.js";
import { activeSockets } from "./socket.js";

dotenv.config()
export class UserService {
  async registerUser(dto) {
    const salt = await bcrypt.genSalt(10);
    const today = new Date();
    const birth = new Date(dto.dateofBirth ? dto.dateofBirth : "01.01.1970");
    let age = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    const newUser = await UserModel.create({
      name: dto.name || "",
      city: dto.city || "",
      age,
      phone: dto.phone || "",
      dateOfBirth: dto.dateofBirth ? new Date(dto.dateofBirth) : new Date(),
      email: dto.email,
      gender: "",
      passwordHash: await bcrypt.hash(dto.password, salt),
      typegooseName: "",
    });
    return newUser.save();
  }

  async findUser(email) {
    return UserModel.findOne({ "privates.email": email }).exec();
  }
  async validateUser(
    res,
    email,
    password,
  ) {
    const user = await this.findUser(email);
    if (!user) {
      throw new UnauthorizedException(res, USER_NOT_FOUND_ERROR);
    }
    const isCorrectPassword = await bcrypt.compare(
      password,
      user.privates.passwordHash,
    );
    if (!isCorrectPassword) {
      throw new UnauthorizedException(res, WRONG_PASSWORD_ERROR);
    }
    return user;
  }

  async login(user) {
    const payload = { email: user.privates.email, id: user._id.toString() };
    const { _id, registered, publik, privates, delivery } = user;

    return {
        _id,
        registered,
        publik,
        privates,
        delivery,
        access_token: jwt.sign(payload, process.env.JWT_SECRET),
    };
  }

  async getUserData(email) {
    return UserModel
      .findOne({ "privates.email": email })
      .select({ publik: 1, privates: 1, delivery: 1, registered: 1, _id: 1 })
      .exec();
  }

  async getAllChats(email) {
    return UserModel
      .findOne({ "privates.email": email })
      .select('chats')
      .populate('chats')
      .exec();
  }

  async createNewChat(dto) {
    const { userId, id, userTitle, titleId } = dto
    const chat = await ChatModel.create({
      participants: [{ userId, title: userTitle }, { userId: id, title: titleId }],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const updateQuery = {
      $push: { chats: { $each: [chat._id], $position: 0 } }
    };
    let user;
    if (id === "672661ab9648816708d509ca") {
      await UserModel.updateMany(
        { _id: { $in: [userId, id] } },
        updateQuery,
        { new: true }
      )
      user = await UserModel.findById(userId).populate('chats').exec();
    } else {
      user = await UserModel.findOneAndUpdate(
        { _id: userId },
        updateQuery,
        { new: true }
      ).populate('chats').exec()
    }
    const socket = activeSockets[id];
    if (socket) {
      socket.emit("new chat", chat);
    }
    return { chats: user.chats }
  }

  async getChatParticipants(chatId) {
    const chat = await ChatModel.findById(chatId).populate('participants'); 
    return chat.participants.map(participant => participant.userId.toString()); }
}
