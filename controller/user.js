import nodemailer from "nodemailer";
import { Student } from "../model/student.js";
import member from "../model/member.js";
import team from "../model/team.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};



const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});


export const sendOTP = async (req, res) => {
  try {
      const { email } = req.body;
      
      const userExist = await Student.findOne({ email: email });

      if (!userExist) {
          throw new ApiError( 400,"Entered email is not registered in the event" )
      }

    const otp = generateOTP();

    // Store in session
    req.session.otp = otp;
    req.session.email = email;

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Your Login OTP",
      text: `Your OTP is ${otp}`
    });

    res.status(200).json({
      message: "OTP sent to email"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
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
      
    //   let user = await member.findOne({ email: req.session.email });
    //   const student = await Student.findOne({ email: req.session.email });

    // if (!user) {

    //   user = await member.create({
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
      data:teamData,user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




const createTeam = asyncHandler(async (req,res)=>{

const leaderEmail = req.user.email;   // leader from login
const { teamName, memberEmail } = req.body;

if(!teamName || !memberEmail){
throw new ApiError(400,"Team name and member required");
}

// leader cannot select himself
if(String(leaderEmail) === String(memberEmail)){
throw new ApiError(400,"Leader and member must be different");
}

// check member exists
const member = await Student.findById(memberEmail);

if(!member){
throw new ApiError(404,"Member not found");
}

// check if leader already in team
const leaderTeam = await team.findOne({
$or:[
{teamLeader:leaderEmail},
{teamMembers:leaderEmail}
]
});

if(leaderTeam){
throw new ApiError(400,"Leader already has a team");
}

// check if member already in team
const memberTeam = await team.findOne({
$or:[
{teamLeader:memberEmail},
{teamMembers:memberEmail}
]
});

if(memberTeam){
throw new ApiError(400,"Member already in a team");
}

// create team
const team = await team.create({

teamName,

teamLeader:req.user.name,

teamMembers:[leaderEmail,memberEmail]

});

return res.status(201).json(
new ApiResponse(201,team,"Team created successfully")
);

});

export { createTeam };