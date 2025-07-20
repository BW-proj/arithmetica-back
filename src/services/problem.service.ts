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
    const player1 = GameManagerService.getInstance().getPlayerByUuid(
      game.players[0]
    );
    const player2 = GameManagerService.getInstance().getPlayerByUuid(
      game.players[1]
    );

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

    let problem: Problem = this.generateMultiplicationProblem(1, 20);

    GameManagerService.getInstance().addProblemToGame(gameUuid, problem);

    return problem;
  }

  public generateMultiplicationProblem(
    difficulty: number,
    maxNumber: number = 10
  ): Problem {
    const num1 = Math.floor(Math.random() * maxNumber) + 1;
    const num2 = Math.floor(Math.random() * maxNumber) + 1;
    const solution = num1 * num2;

    return {
      uuid: crypto.randomUUID(),
      title: `${num1} x ${num2}`,
      description: `${num1} x ${num2}`,
      difficulty: difficulty,
      solution: solution,
    };
  }
}
