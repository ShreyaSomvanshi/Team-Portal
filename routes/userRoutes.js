import { Router } from "express";
import { createTeam ,sendOTP,verifyOTP} from "../controller/user.js"

const userRouter=Router();

userRouter.route("/create").post(createTeam)

userRouter.route("/sendotp").post(sendOTP)
userRouter.route("/verifyotp").get(verifyOTP)

export default userRouter