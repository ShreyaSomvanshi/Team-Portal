import nodemailer from "nodemailer";
import { Student } from "../model/student.js";
import { Team } from "../model/team.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Dataset } from "../model/dataset.js";


const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ use ENV (IMPORTANT)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});




// ================= SEND OTP =================
export const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await Student.findOne({ email });

  if (!user) {
    throw new ApiError(400, "Entered email is not registered");
  }

  const existedLeader = await Team.findOne({ _id: user._id });

  if (existedLeader) {
    throw new ApiError(400, "Leader has already registered");
  }

  const otp = generateOTP();

  // store session
  req.session.otp = otp;
  req.session.user = user;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Login OTP",
    text: `Your OTP is ${otp}`,
  });
  console.log(req.session);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "OTP sent successfully"));
});


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
    const user = await Student.findById(req.session.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Session me store
    req.user = user;

    res.status(200).json({
      message: "Login successful",
      user,
    });

  } catch (err) {
    console.log(err)
    res.status(500).json({ error: err.message });
  }
  };


export const createTeam = asyncHandler(async (req, res) => {
  try {
    const leaderEmail = req.user.email;
    const leaderId = req.user._id;
  
    const { teamName, memberEmail } = req.body;
  
    // ✅ basic validation
    if (!teamName || !memberEmail) {
      throw new ApiError(400, "Team name and member email required");
    }
  
    if (leaderEmail === memberEmail) {
      throw new ApiError(400, "Leader and member must be different");
    }
  
    // ✅ check member exists
    const member = await Student.findOne({ email: memberEmail });
  
    if (!member) {
      throw new ApiError(404, "Member not found");
    }
  
    // ✅ same year validation
    if (req.user.year !== member.year) {
      throw new ApiError(400, "Both members must be of same year");
    }
  
    // ✅ leader already in any team
    const leaderTeam = await Team.findOne({
      members: leaderId,
    });
  
    if (leaderTeam) {
      throw new ApiError(400, "Leader already has a team");
    }
  
    // ✅ member already in any team
    const memberTeam = await Team.findOne({
      members: member._id,
    });
  
    if (memberTeam) {
      throw new ApiError(400, "Member already in a team");
    }
  
    // ✅ team name duplicate check (IMPORTANT because unique:true gives ugly error)
    const existingTeamName = await Team.findOne({ teamName });
  
    if (existingTeamName) {
      throw new ApiError(400, "Team name already taken");
    }
  
    // ✅ create team
    const team = await Team.create({
      teamName,
      teamYear: req.user.year,
      teamLeader: leaderId,
      members: [leaderId, member._id],
      dataset: null, // optional but explicit
    });
  
    // ✅ populate for better frontend response
    const populatedTeam = await Team.findById(team._id)
      .populate("teamLeader", "name email")
      .populate("members", "name email");
  
    return res
      .status(201)
      .json(
        new ApiResponse(201, populatedTeam, "Team created successfully")
      );
  } catch (error) {
    console.log(error)
    return res.status(400).json({
      message: "failed to create team", 
      success:false
    })
  }
});




export const saveDatasetToTeam = asyncHandler(async (req, res) => {
  const { datasetLink } = req.body;
  const { teamId } = req.params;

  if (!teamId || !datasetLink) {
    throw new ApiError(400, "teamId and datasetLink are required");
  }

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // ✅ prevent duplicate dataset
  if (team.dataset) {
    throw new ApiError(400, "Dataset already assigned to this team");
  }

  // ✅ create dataset (according to schema)
  const dataset = await Dataset.create({
    team: teamId,
    year: team.teamYear, // 🔥 auto from team
    link: datasetLink,
  });

  // ✅ link dataset to team
  team.dataset = dataset._id;
  await team.save();

  // ✅ populated response
  const updatedTeam = await Team.findById(teamId)
    .populate("dataset")
    .populate("members", "name email");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        team: updatedTeam,
        dataset,
      },
      "Dataset assigned to team successfully"
    )
  );
});