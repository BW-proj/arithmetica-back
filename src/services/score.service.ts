// score.service.ts
import { Player } from "../types";
import { EloHelperService } from "./elo-helper.service";

export class ScoreService {
  incrementScore(player: Player): Player {
    return { ...player, currentScore: player.currentScore + 1 };
  }

  decrementScore(player: Player): Player {
    return { ...player, currentScore: Math.max(0, player.currentScore - 1) };
  }

  calculateElo(
    playerA: Player,
    playerB: Player
  ): { updatedA: number; updatedB: number } {
    const winnerA = playerA.currentScore > playerB.currentScore;
    const diff = Math.abs(playerA.currentScore - playerB.currentScore);
    const { playerARating, playerBRating } = EloHelperService.calculateElo(
      playerA.elo,
      playerB.elo,
      winnerA,
      diff
    );
    return { updatedA: playerARating, updatedB: playerBRating };
  }
}
