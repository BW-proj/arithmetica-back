// game.service.ts
import crypto from "crypto";
import { Game, Problem } from "../types";

export class GameService {
  private games = new Map<string, Game>();

  create(players: string[]): Game {
    const game: Game = {
      uuid: crypto.randomUUID(),
      players,
      startedAt: new Date(),
      problems: [],
    };
    this.games.set(game.uuid, game);
    return game;
  }

  getByUuid(uuid: string): Game | undefined {
    return this.games.get(uuid);
  }

  end(uuid: string): Game | null {
    const game = this.games.get(uuid);
    if (!game) return null;
    this.games.delete(uuid);
    return game;
  }

  addProblem(gameUuid: string, problem: Problem) {
    const game = this.games.get(gameUuid);
    if (game) {
      game.problems.push(problem);
    }
  }

  getPlayerGame(playerUuid: string): Game | undefined {
    return Array.from(this.games.values()).find((g) =>
      g.players.includes(playerUuid)
    );
  }

  getAll(): Game[] {
    return Array.from(this.games.values());
  }
}
