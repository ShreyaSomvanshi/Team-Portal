import { Router } from "express";
import { createTeam ,saveDatasetToTeam,sendOTP,verifyOTP} from "../controller/user.js"
import { isAuthenticated } from "../middleware/authentic.js";

const userRouter=Router();

userRouter.route("/create").post(isAuthenticated,createTeam)

userRouter.route("/sendotp").post(sendOTP)
userRouter.route("/verifyotp").get(verifyOTP)
userRouter.route("/getDataSet/:teamId").post(isAuthenticated,saveDatasetToTeam);

export default userRouter