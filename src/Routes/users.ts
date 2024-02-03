import { Router } from "express";
import UserController from "../Controllers/users";
import { checkToken, isAdmin } from "../middleware/auth";
const userRouter = Router();

userRouter.post('/signup', UserController.signup);
userRouter.post('/verify-email',checkToken, UserController.verifyMail);
userRouter.post('/verify-phoneno', checkToken, UserController.verifyPhoneno);
userRouter.post('/resend-verify-otp', checkToken, UserController.resendVerifyOTP);
userRouter.post('/login', UserController.login);
userRouter.patch('/upload-profile-pic', checkToken, UserController.uploadProfilePic);

userRouter.get('/send-otp', checkToken, UserController.resendVerifyOTP);
userRouter.get('/profile', checkToken, UserController.getDetails)

//admin
userRouter.post('/assign-role/:userId', checkToken, isAdmin, UserController.assignRoleToUser)
userRouter.post('/remove-role/:userId', checkToken, isAdmin, UserController.removeUserRole)



//MFA
userRouter.post('/enable-mfa', checkToken, UserController.enableMFA);
userRouter.post('/disable-mfa', checkToken, UserController.disableMFA);
userRouter.post('/verify-mfa', checkToken, UserController.verifyMFAToken)
userRouter.post('/resend-mfa-token', checkToken, UserController.resendMFAOTP);

export default userRouter;