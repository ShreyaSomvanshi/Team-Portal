import nodemailer from "nodemailer";
import { Student } from "../model/student";
import { ApiError } from "../utils/ApiError";
import member from "../model/member";
import team from "../model/team";

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
      
      let user = await member.findOne({ email: req.session.email });
      const student = await student.findOne({ email: req.session.email });

    if (!user) {

      user = await member.create({
        name: Student.name,
        email: req.session.email,
      });
      }
    else {
        return res.status(400).json({
            message: "Member already registered",
            success:false
        })
      }
      
      const teamData = await team.create({
          teamLeader: Student.name
      })
      
      
    res.status(200).json({
      message: "Login successful",
        email: req.session.email,
      data:teamData,user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

