import { Router } from 'express';
import userController from '../controllers/userController.js';
const userRouter = Router();

userRouter.post('/save-users', userController.saveUsersC);

export default userRouter;