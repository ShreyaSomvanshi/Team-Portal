import { Student } from "../model/student.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await Student.findById(req.session.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    req.user.email = user.email;

    next();

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};