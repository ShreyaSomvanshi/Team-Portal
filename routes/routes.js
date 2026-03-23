import { Router } from "express";
import { gradeTeam,getAllTeams,getTeamDetails } from "../controller/Admin.controller.js";

const router=Router();
//routes
router.route("/grade/:teamId").post(gradeTeam)
router.route("/getAllTeams").get(getAllTeams)
router.route("/teamDetails/:teamId").post(getTeamDetails)

export default adminRouter