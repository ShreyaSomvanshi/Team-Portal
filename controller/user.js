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

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
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

    // Success → clear OTP
    req.session.otp = null;

    //   let user = await Member.findOne({ email: req.session.email });
    //   const student = await Student.findOne({ email: req.session.email });

    // if (!user) {

    //   user = await Member.create({
    //     name: student.name,
    //     email: req.session.email,
    //   });
    //   }
    // else {
    //     return res.status(400).json({
    //         message: "Member already registered",
    //         success:false
    //     })
    //   }

    //   const teamData = await team.create({
    //       teamLeader: student.name,
    //       teamLeaderMail:req.session.email
    //   })

    res.status(200).json({
      message: "Login successful",
      email: req.session.email,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createTeam = asyncHandler(async (req, res) => {
  const leaderEmail = req.user.email; // leader from login
  const { teamName, memberEmail } = req.body;

  if (!teamName || !memberEmail) {
    throw new ApiError(400, "Team name and member required");
  }

  // leader cannot select himself
  if (String(leaderEmail) === String(memberEmail)) {
    throw new ApiError(400, "Leader and member must be different");
  }

  // check member exists
  const member = await Student.findById(memberEmail);

  if (!member) {
    throw new ApiError(404, "Member not found");
  }

  // check if leader already in team
  const leaderTeam = await Team.findOne({
    $or: [{ teamLeader: leaderEmail }, { teamMembers: leaderEmail }],
  });

  if (leaderTeam) {
    throw new ApiError(400, "Leader already has a team");
  }

  // check if member already in team
  const memberTeam = await Team.findOne({
    $or: [{ teamLeader: memberEmail }, { teamMembers: memberEmail }],
  });

  if (memberTeam) {
    throw new ApiError(400, "Member already in a team");
  }

  // create team
  const team = await Team.create({
    teamName,

    teamLeader: req.user.name,

    teamMembers: [leaderEmail, memberEmail],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, team, "Team created successfully"));
});

export { createTeam };
