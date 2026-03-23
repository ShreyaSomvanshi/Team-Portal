import { Student } from "../model/student.js";
import User from "../model/user.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    if (!req.session.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await Student.findById(req.session.email);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;

    next();

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};