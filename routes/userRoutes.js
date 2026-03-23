import { Router } from "express";
import { createTeam ,sendOTP,verifyOTP} from "../controller/user.js"

const router=Router();

router.route("/create").post(createTeam)

router.route("/sendotp").post(sendOTP)
router.route("/verifyotp").get(verifyOTP)

export default userRouter