// matchmaking.service.ts
import { Player } from "../types";

export class MatchmakingService {
  constructor(private readonly maxEloDiff = 100) {}

  findMatch(player: Player, candidates: Player[]): Player | null {
    return (
      candidates.find(
        (p) =>
          p.uuid !== player.uuid &&
          p.status === player.status &&
          Math.abs(p.elo - player.elo) <= this.maxEloDiff
      ) || null
    );
  }
}
