import { max } from "class-validator";
import { GameManagerService, Problem } from "./game-manager.service";
import crypto from "crypto";

export class ProblemService {
  private static instance: ProblemService;

  private constructor() {}

  public static getInstance(): ProblemService {
    if (!ProblemService.instance) {
      ProblemService.instance = new ProblemService();
    }
    return ProblemService.instance;
  }

  public getOrCreateProblemForGame(gameUuid: string): Problem | null {
    const game = GameManagerService.getInstance().getGameByUuid(gameUuid);
    if (!game) {
      return null;
    }
    const player1 = GameManagerService.getInstance().getPlayerByUuid(game.players[0]);
    const player2 = GameManagerService.getInstance().getPlayerByUuid(game.players[1]);

    if (!player1 || !player2) {
      return null;
    }

    const maxScore = Math.max(player1.currentScore, player2.currentScore);
    if (maxScore >= game.problems.length) {
      return this.createProblemForGame(gameUuid);
    }
    return game.problems[maxScore];
  }

  public createProblemForGame(gameUuid: string): Problem | null {
    const game = GameManagerService.getInstance().getGameByUuid(gameUuid);
    if (!game) {
      return null;
    }

    let problem: Problem = {
      uuid: crypto.randomUUID(),
      title: "Sample Problem",
      description: "2 + 2",
      difficulty: 1,
      solution: 4,
    };

    GameManagerService.getInstance().addProblemToGame(gameUuid, problem);

    return problem;
  }
}
