import mongoose from "mongoose";
const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true,
    trim: true
  },
  teamYear: {
    type: Number,
    required: true
    },
    teamLeader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "memberSchema",
      required: true
    },
    teamLeaderMail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "memberSchema",
      required: true
    }],

    dataSet: {
        type: String,
        required: true,
  }

    
    
}, {
  timestamps: true
});

export default mongoose.model("Team", teamSchema);