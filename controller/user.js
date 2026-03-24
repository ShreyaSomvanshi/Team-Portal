import nodemailer from "nodemailer";
import { Student } from "../model/student.js";
import { Member } from "../model/member.js";
import { Team } from "../model/team.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

    // console.log("EMAIL_USER:", process.env.EMAIL_USER);
    // console.log("EMAIL_PASS:", process.env.EMAIL_PASS);
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "shreyamisthi@gmail.com",
    pass: "ggvaycsuensqnlcn"
  }
});


export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const userExist = await Student.findOne({ email: email });

    if (!userExist) {
      throw new ApiError(400, "Entered email is not registered in the event");
    }

    const otp = generateOTP();

    console.log("hI");

    // Store in session
    req.session.otp = otp;
    req.session.email = email;
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS:", process.env.EMAIL_PASS);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Login OTP",
      text: `Your OTP is ${otp}`,
    });

    res.status(200).json({
      message: "OTP sent to email",
    });

  } catch (err) {
    console.log(err)
    res.status(500).json({
      error: err.message
    });
  }
};

  export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!req.session.otp) {
      return res.status(400).json({ message: "Session expired" });
    }

    if (req.session.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP clear
    req.session.otp = null;

    // User fetch
    const user = await Student.findOne({ email: req.session.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Session me store
    req.session.userId = user._id;

    res.status(200).json({
      message: "Login successful",
      user,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  };
 export const createTeam = asyncHandler(async (req, res) => {
  try {
    const leaderEmail = req.user.email;
    const leaderName = req.user.name;
    const leaderId = req.user._id;

    const { teamName, memberEmail } = req.body;

    if (!teamName || !memberEmail) {
      throw new ApiError(400, "Team name and member required");
    }

    // leader cannot select himself
    if (leaderEmail === memberEmail) {
      throw new ApiError(400, "Leader and member must be different");
    }

    // check member exists
    const member = await Student.findOne({ email: memberEmail });

    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    //  check if leader already in team
    const leaderTeam = await Team.findOne({
      $or: [
        { teamLeaderMail: leaderEmail }, // leader by email
        { members: leaderId }            // leader in members array
      ],
    });

    if (leaderTeam) {
      throw new ApiError(400, "Leader already has a team");
    }

    // 🔥 check if member already in team
    const memberTeam = await Team.findOne({
      $or: [
        { teamLeaderMail: memberEmail },
        { members: member._id }
      ],
    });

    if (memberTeam) {
      throw new ApiError(400, "Member already in a team");
    }

    // 🔥 create team
    const team = await Team.create({
      teamName,
      teamYear: new Date().getFullYear(), // required field fix
      teamLeader: leaderName,
      teamLeaderMail: leaderEmail,
      members: [leaderId, member._id],
      dataSet: "default", // required field fix (change if needed)
    });

    return res.status(201).json({
      success: true,
      message: "Team created successfully",
      team,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to create team",
      success: false,
    });
  }
});