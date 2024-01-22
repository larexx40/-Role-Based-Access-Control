import { Router } from "express";
import UserController from "../Controllers/users";
import { checkToken } from "../middleware/auth";
const userRouter = Router();

userRouter.post('/signup', UserController.signup);
userRouter.post('/verify-email',checkToken, UserController.verifyMail);
userRouter.post('/verify-phoneno', checkToken, UserController.verifyPhoneno);
userRouter.post('resend-verify-otp', checkToken, UserController.resendVerifyOTP);
userRouter.post('/login', UserController.login);

userRouter.get('/send-otp', checkToken, UserController.resendVerifyOTP);





//MFA
userRouter.post('/enable-mfa', checkToken, UserController.enableMFA);
userRouter.post('/disable-mfa', checkToken, UserController.disableMFA);
userRouter.post('/verify-mfa', checkToken, UserController.verifyMFAToken)
userRouter.post('/resend-mfa-token', checkToken, UserController.resendMFAOTP);

export default userRouter;