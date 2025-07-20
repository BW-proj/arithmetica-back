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

    let problem: Problem = this.generateProblem(game.difficulty ?? 1);

    GameManagerService.getInstance().addProblemToGame(gameUuid, problem);

    return problem;
  }

  public generateProblem(difficulty: number): Problem {
    const types = this.getProblemTypesForDifficulty(difficulty);
    const type = types[Math.floor(Math.random() * types.length)];

    switch (type) {
      case "multiplication":
        return this.generateMultiplicationProblem(difficulty);
      case "addition":
        return this.generateAdditionProblem(difficulty);
      case "subtraction":
        return this.generateSubtractionProblem(difficulty);
      case "division":
        return this.generateDivisionProblem(difficulty);
      case "expression":
        return this.generateExpressionProblem(difficulty);
      default:
        return this.generateMultiplicationProblem(difficulty);
    }
  }

  private getProblemTypesForDifficulty(difficulty: number): string[] {
    if (difficulty <= 2) return ["addition", "subtraction", "multiplication"];
    if (difficulty <= 4) return ["multiplication", "division", "addition"];
    return ["multiplication", "division", "expression"];
  }

  private buildProblem(
    a: number,
    b: number,
    op: string,
    solution: number,
    difficulty: number
  ): Problem {
    const title = `${a} ${op} ${b}`;
    return {
      uuid: crypto.randomUUID(),
      title: title,
      description: title,
      difficulty: difficulty,
      solution: solution,
    };
  }

  private generateAdditionProblem(difficulty: number): Problem {
    const max = 10 + difficulty * 5;
    const a = this.rand(1, max);
    const b = this.rand(1, max);
    return this.buildProblem(a, b, "+", a + b, difficulty);
  }

  private generateSubtractionProblem(difficulty: number): Problem {
    const max = 10 + difficulty * 5;
    const a = this.rand(1, max);
    const b = this.rand(1, a); // pour éviter les résultats négatifs
    return this.buildProblem(a, b, "-", a - b, difficulty);
  }

  private generateMultiplicationProblem(difficulty: number): Problem {
    const max = 5 + difficulty * 3;
    const a = this.rand(1, max);
    const b = this.rand(1, max);
    return this.buildProblem(a, b, "x", a * b, difficulty);
  }

  private generateDivisionProblem(difficulty: number): Problem {
    const b = this.rand(1, 5 + difficulty * 2);
    const result = this.rand(1, 5 + difficulty * 2);
    const a = b * result;
    return this.buildProblem(a, b, "÷", result, difficulty);
  }

  private generateExpressionProblem(difficulty: number): Problem {
    const a = this.rand(1, 10 + difficulty * 3);
    const b = this.rand(1, 10 + difficulty * 3);
    const c = this.rand(1, 5 + difficulty);
    const solution = a + b * c;
    const title = `${a} + ${b} x ${c}`;
    return {
      uuid: crypto.randomUUID(),
      title: title,
      description: title,
      difficulty: difficulty,
      solution: solution,
    };
  }

  private rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
