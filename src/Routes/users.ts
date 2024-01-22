import { Router } from "express";
import UserController from "../Controllers/users";
const userRouter = Router();

userRouter.post('/signup', UserController.signup);
userRouter.post('/verify-email', UserController.verifyMail)

export default userRouter;