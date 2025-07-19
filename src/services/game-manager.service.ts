import crypto from "crypto";
import { EloHelperService } from "./elo-helper.service";
import { logger } from "../loggers/logger";

enum PlayerStatus {
  SEARCHING = "searching",
  PLAYING = "playing",
  CONNECTED = "connected",
}

interface Player {
  uuid: string;
  login: string;
  elo: number;
  status: PlayerStatus;
}

interface GameScore {
  player1Score: number;
  player2Score: number;
}

interface Problem {
  uuid: string; // Problem UUID
  title: string; // Problem title
  description: string; // Problem description
  difficulty: number; // Problem difficulty
  solution: number; // Problem solution
}

export interface Game {
  uuid: string; // Game UUID
  players: string[]; // Player UUIDs
  score: GameScore;
  startedAt?: Date;
  currentProblem?: Problem; // Current problem in the game
}

export class GameManagerService {
  private runningGames: Game[] = [];
  private connectedPlayers: Player[] = [];

  private static instance: GameManagerService;

  private constructor() {}
  public static getInstance(): GameManagerService {
    if (!GameManagerService.instance) {
      GameManagerService.instance = new GameManagerService();
    }
    return GameManagerService.instance;
  }

  public registerPlayer(login: string) {
    const player: Player = {
      uuid: crypto.randomUUID(),
      login,
      elo: 1000,
      status: PlayerStatus.CONNECTED,
    };
    logger.info(`Registering player: ${login} with UUID: ${player.uuid}`);
    this.connectedPlayers.push(player);
    return player;
  }

  public unregisterPlayer(playerUuid: string): void {
    this.connectedPlayers = this.connectedPlayers.filter(
      (player) => player.uuid !== playerUuid
    );
  }

  public playerSearchGame(playerUuid: string): Game | boolean {
    const player = this.getUserByUuid(playerUuid);
    if (!player) {
      return false;
    }
    player.status = PlayerStatus.SEARCHING;
    this.updateUser(playerUuid, { status: PlayerStatus.SEARCHING });

    const matchedPlayer = this.matchmakePlayer(playerUuid);
    if (matchedPlayer) {
      this.updateUser(playerUuid, { status: PlayerStatus.PLAYING });
      this.updateUser(matchedPlayer.uuid, { status: PlayerStatus.PLAYING });

      const game = this.createGame(player.uuid, matchedPlayer.uuid);
      return game;
    }
    return true; // No match found
  }

  public matchmakePlayer(playerUuid: string): Player | null {
    const player = this.getUserByUuid(playerUuid);
    if (!player) {
      return null; // Player not found
    }
    if (player.status !== PlayerStatus.SEARCHING) {
      return null; // Player is not searching for a game
    }

    // Find another player that is searching
    const otherPlayer = this.connectedPlayers.find(
      (p) => p.status === PlayerStatus.SEARCHING && p.uuid !== playerUuid
    );
    return otherPlayer || null;
  }

  public getUserByUuid(playerUuid: string): Player | null {
    return (
      this.connectedPlayers.find((player) => player.uuid === playerUuid) || null
    );
  }

  public updateUser(playerUuid: string, updatedData: Partial<Player>): void {
    const playerIndex = this.connectedPlayers.findIndex(
      (player) => player.uuid === playerUuid
    );
    if (playerIndex !== -1) {
      this.connectedPlayers[playerIndex] = {
        ...this.connectedPlayers[playerIndex],
        ...updatedData,
      };
    }
  }

  public getConnectedPlayers(): Player[] {
    return this.connectedPlayers;
  }

  public createGame(playerAUuid: string, playerBUuid: string): Game {
    const game: Game = {
      uuid: crypto.randomUUID(),
      players: [playerAUuid, playerBUuid],
      score: {
        player1Score: 0,
        player2Score: 0,
      },
    };
    this.runningGames.push(game);
    return game;
  }

  public endGame(gameUuid: string): Game | null {
    const gameIndex = this.runningGames.findIndex(
      (game) => game.uuid === gameUuid
    );

    if (gameIndex === -1) {
      return null; // Game not found
    }

    const finishedGame = this.runningGames[gameIndex];

    // Remove the game from running games
    this.runningGames.splice(gameIndex, 1);

    // Update the players' elo based on the game score
    const { playerARating, playerBRating } = EloHelperService.calculateElo(
      finishedGame.score.player1Score,
      finishedGame.score.player2Score,
      finishedGame.score.player1Score > finishedGame.score.player2Score
    );

    this.updateUser(finishedGame.players[0], {
      elo: playerARating,
      status: PlayerStatus.CONNECTED,
    });
    this.updateUser(finishedGame.players[1], {
      elo: playerBRating,
      status: PlayerStatus.CONNECTED,
    });

    return finishedGame;
  }

  public getUserCurrentGame(playerUuid: string): Game | null {
    return (
      this.runningGames.find((game) => game.players.includes(playerUuid)) ||
      null
    );
  }

  public getPlayerByUuid(playerUuid: string): Player | null {
    return (
      this.connectedPlayers.find((player) => player.uuid === playerUuid) || null
    );
  }
}
