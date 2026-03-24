import { Router } from "express";
import { createTeam ,sendOTP,verifyOTP} from "../controller/user.js"
import { isAuthenticated } from "../middleware/authentic.js";

const userRouter=Router();

userRouter.route("/create").post(isAuthenticated,createTeam)

userRouter.route("/sendotp").post(sendOTP)
userRouter.route("/verifyotp").get(verifyOTP)

export default userRouter