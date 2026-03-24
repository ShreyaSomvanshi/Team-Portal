import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Team } from "../model/team.js";
export const getAllTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find()
    .populate("members", "name")
    .select("teamName members dataSet scores");

  const formattedTeams = teams.map(team => ({
    teamName: team.teamName,
    members: team.members.map(m => m.name),
    dataSet: team.dataSet,
    scores: team.scores || []
  }));
  return res.status(200).json(
    new ApiResponse(200, formattedTeams, "Teams fetched successfully")
  );
});


export const getTeamDetails = asyncHandler(async (req, res) => {
  let { teamId } = req.params;
  teamId = teamId.trim();
  const team = await Team.findById(teamId)
    .populate("members", "name email");

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  return res.status(200).json(
    new ApiResponse(200, team, "Team details fetched successfully")
  );
});


export const gradeTeam = asyncHandler(async (req, res) => {
  let { teamId } = req.params;
  teamId = teamId.trim();

  // ✅ ObjectId validation
  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    throw new ApiError(400, "Invalid Team ID");
  }

  const { round, understanding, approach, result, presentation } = req.body;

  // ✅ round validation
  if (![1, 2, 3].includes(Number(round))) {
    throw new ApiError(400, "Invalid round (1,2,3 allowed)");
  }

  // ✅ required fields
  if ([understanding, approach, result, presentation].some(v => v === undefined)) {
    throw new ApiError(400, "All parameters required");
  }

  // ✅ range validation
  if (
    understanding < 0 || understanding > 40 ||
    approach < 0 || approach > 30 ||
    result < 0 || result > 20 ||
    presentation < 0 || presentation > 10
  ) {
    throw new ApiError(400, "Scores exceed allowed limits");
  }

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // ✅ total score
  const totalScore = understanding + approach + result + presentation;

  // ensure array exists
  if (!team.scores) team.scores = [];

  // 🔥 CLEAN OLD INVALID DATA (VERY IMPORTANT)
  team.scores = team.scores.filter(s =>
    s.round !== undefined &&
    s.understanding !== undefined &&
    s.approach !== undefined &&
    s.result !== undefined &&
    s.presentation !== undefined
  );

  // 🔥 NEW SCORE OBJECT
  const newScore = {
    round: Number(round),
    understanding,
    approach,
    result,
    presentation,
    totalScore
  };

  // 🔥 CREATE + UPDATE LOGIC (SAME API)
  team.scores = team.scores.filter(
    s => s.round !== Number(round)
  );

  team.scores.push(newScore);

  // optional sorting
  team.scores.sort((a, b) => a.round - b.round);

  await team.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      team.scores,
      `Round ${round} graded successfully (created/updated)`
    )
  );
});