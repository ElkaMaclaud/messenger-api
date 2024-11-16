import { UserService } from "../services/userService.js";
import { ALREADY_REGISTERED_ERROR } from "../constants.js";
import { BadRequestException } from "../errors/BadRequestException.js"

export class UserController {
  constructor() {
    this.userService = new UserService();
  }
  async register(req, res) {
    const dto = req.body;
    const user = await this.userService.findUser(dto.email);
    if (user) {
      return new BadRequestException(res, ALREADY_REGISTERED_ERROR);
    }
    return res.json(await this.userService.registerUser(dto));
  }

  async login(req, res) {
    const { email: login, password } = req.body;
    try {
      const user = await this.userService.validateUser(res, login, password);
      return res.json(await this.userService.login(user));
    } catch (err) {
      const statusCode = err.status || 401;
      return res.status(statusCode).json({
        message: err.message,
      });
    }
  }

  async getUserData(req, res) {
    try {
      const email = req.userEmail;
      return res.json(await this.userService.getUserData(email));
    } catch (error) {
      return res.status(403).json({ success: false, message: error })
    }
  }

  async getAllChats(req, res) {
    try {
      const email = req.userEmail;
      return res.json(await this.userService.getAllChats(email));
    } catch (error) {
      return res.status(403).json({ success: false, message: error })
    }
  }

  async createNewChat(req, res) {
    try {
      const dto = req.body;
      const result = await this.userService.createNewChat(dto)
      return res.json(result)
    } catch (error) {
      return res.status(403).json({ success: false, message: error })
    }
  }
}