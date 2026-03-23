import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Team } from "../models/team.model.js";

const getAllTeams = asyncHandler(async (req,res)=>{

const teams = await Team.find()
.populate("members","name")
.select("teamName members dataset scores");

const formattedTeams = teams.map(team => ({
teamName: team.teamName,

members: team.members.map(member => member.name),

dataset: team.dataset,

scores:{
round1: team.scores.round1,
round2: team.scores.round2,
round3: team.scores.round3
}

}));

return res.status(200).json(
new ApiResponse(200,formattedTeams,"Teams fetched successfully")
);

});

const getTeamDetails = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { team }, "Team details fetched successfully"));
});

const gradeTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  const { 
    round, 
    understanding, 
    reasoning, 
    presentation, 
    clarity, 
    execution 
  } = req.body;

  if (![1, 2, 3].includes(Number(round))) {
    throw new ApiError(400, "Invalid round. Round must be 1, 2, or 3.");
  }

  if ([understanding, reasoning, presentation, clarity, execution].some(
      (param) => param === undefined || param === null
    )
  ) {
    throw new ApiError(400, "All 5 grading parameters are required");
  }

  const scoreValues =[understanding, reasoning, presentation, clarity, execution];
  if (scoreValues.some((score) => score < 0 || score > 10)) {
    throw new ApiError(400, "All scores must be between 0 and 10");
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  const totalScore = understanding + reasoning + presentation + clarity + execution;

  const existingScoreIndex = team.scores.findIndex(
    (score) => score.round === Number(round)
  );

  if (existingScoreIndex !== -1) {
    team.scores[existingScoreIndex].understanding = understanding;
    team.scores[existingScoreIndex].reasoning = reasoning;
    team.scores[existingScoreIndex].presentation = presentation;
    team.scores[existingScoreIndex].clarity = clarity;
    team.scores[existingScoreIndex].execution = execution;
    team.scores[existingScoreIndex].totalScore = totalScore;
  } else {
    team.scores.push({
      round: Number(round),
      understanding,
      reasoning,
      presentation,
      clarity,
      execution,
      totalScore
    });
  }

  await team.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200, 
        { scores: team.scores }, 
        `Team successfully graded for Round ${round}`
      )
    );
});

export { getAllTeams, gradeTeam };