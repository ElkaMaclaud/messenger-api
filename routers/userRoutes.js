import express from "express";
import { UserController } from "../controllers/userController.js"; 
import  auth  from "../middlewares/authMiddleware.js"; 

const router = express.Router();
const userController = new UserController();

router.post("/auth/register", (req, res) => userController.register(req, res));
router.post("/auth/login", (req, res) => userController.login(req, res));

router.use(auth); 

router.get("/userData", (req, res) => userController.getUserData(req, res));
router.get("/getAllChats", (req, res) => userController.getAllChats(req, res));
router.post("/createNewChat", (req, res) => userController.createNewChat(req, res));

export default router;