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
      type: String,
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
      ref: "Student",
      required: true
    }],

    dataSet: {
        type: String,
        required: true,
  },
    scores: [
  {
    round: { type: Number, enum: [1, 2, 3], required: true },

    understanding: { type: Number, required: true }, // out of 40
    approach: { type: Number, required: true },      // out of 30
    result: { type: Number, required: true },        // out of 20
    presentation: { type: Number, required: true },  // out of 10

    totalScore: { type: Number }
  }
]
},
 {
  timestamps: true
});

export const Team =  mongoose.model("Team", teamSchema);