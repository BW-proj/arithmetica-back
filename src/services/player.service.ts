// player.service.ts
import { Player, PlayerStatus } from "../types";
import crypto from "crypto";

const BASE_ELO = 1000;

export class PlayerService {
  private players = new Map<string, Player>();

  register(login: string): Player {
    const player: Player = {
      uuid: crypto.randomUUID(),
      login,
      elo: BASE_ELO,
      currentScore: 0,
      status: PlayerStatus.CONNECTED,
    };
    this.players.set(player.uuid, player);
    return player;
  }

  getAll(): Player[] {
    return Array.from(this.players.values());
  }

  getByUuid(uuid: string): Player | undefined {
    return this.players.get(uuid);
  }

  update(uuid: string, updates: Partial<Player>) {
    const player = this.players.get(uuid);
    if (player) {
      this.players.set(uuid, { ...player, ...updates });
    }
  }

  remove(uuid: string) {
    this.players.delete(uuid);
  }

  incrementScore(uuid: string): Player | undefined {
    const player = this.getByUuid(uuid);
    if (!player) return undefined;
    const updatedPlayer = { ...player, currentScore: player.currentScore + 1 };
    this.update(uuid, updatedPlayer);
    return updatedPlayer;
  }

  updateStatus(uuid: string, newStatus: PlayerStatus) {
    const player = this.getByUuid(uuid);
    if (!player) throw new Error("Player not found");

    const updatedStatus = PlayerStateMachine.transition(
      player.status,
      newStatus
    );
    this.update(uuid, { status: updatedStatus });
  }
}

type Transition = {
  from: PlayerStatus[];
  to: PlayerStatus;
};

const allowedTransitions: Transition[] = [
  { from: [PlayerStatus.CONNECTED], to: PlayerStatus.SEARCHING },
  { from: [PlayerStatus.SEARCHING], to: PlayerStatus.WAITING },
  { from: [PlayerStatus.WAITING], to: PlayerStatus.PLAYING },
  { from: [PlayerStatus.PLAYING], to: PlayerStatus.CONNECTED },
  {
    from: [
      PlayerStatus.CONNECTED,
      PlayerStatus.SEARCHING,
      PlayerStatus.WAITING,
      PlayerStatus.PLAYING,
    ],
    to: PlayerStatus.CONNECTED,
  },
];

export class PlayerStateMachine {
  static canTransition(from: PlayerStatus, to: PlayerStatus): boolean {
    return allowedTransitions.some((t) => t.to === to && t.from.includes(from));
  }

  static transition(current: PlayerStatus, next: PlayerStatus): PlayerStatus {
    if (!this.canTransition(current, next)) {
      throw new Error(
        `Invalid status transition from "${current}" to "${next}"`
      );
    }
    return next;
  }
}
