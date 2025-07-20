import crypto from "crypto";
import { EloHelperService } from "./elo-helper.service";
import { logger } from "../loggers/logger";

const MAX_ELO_DIFFERENCE = 100; // Maximum allowed Elo difference for matchmaking
const BASE_ELO = 1000; // Base Elo rating for new players

export enum PlayerStatus {
  SEARCHING = "searching",
  WAITING = "waiting",
  PLAYING = "playing",
  CONNECTED = "connected",
}

export interface Player {
  uuid: string;
  login: string;
  elo: number;
  status: PlayerStatus;
  currentScore: number;
}
export interface Problem {
  uuid: string; // Problem UUID
  title: string; // Problem title
  description: string; // Problem description
  difficulty: number; // Problem difficulty
  solution: number; // Problem solution
}

export interface Game {
  uuid: string; // Game UUID
  players: string[]; // Player UUIDs
  startedAt: Date;
  problems: Problem[];
  difficulty?: number; // Optional difficulty for the game
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
      currentScore: 0,
      elo: BASE_ELO,
      status: PlayerStatus.CONNECTED,
      // difficulty: 1, -> Compute difficulty based on elo or other factors
    };
    logger.info(`Registering player: ${login} with UUID: ${player.uuid}`);
    this.connectedPlayers.push(player);
    return player;
  }

  getLeaderboard(size: number = 10): {
    players: {
      login: string;
      elo: number;
      isInGame: boolean;
    }[];
  } {
    if (this.connectedPlayers.length === 0) {
      return { players: [] };
    }
    const leaderboard = this.connectedPlayers.map((player) => ({
      login: player.login,
      elo: player.elo,
      isInGame: this.getUserCurrentGame(player.uuid) !== null,
    }));

    // Sort by elo descending
    leaderboard.sort((a, b) => b.elo - a.elo);
    return { players: leaderboard.slice(0, size) };
  }

  // Returns true if player was in game and was removed, false otherwise
  public unregisterPlayer(playerUuid: string): Game | null {
    const game = this.getUserCurrentGame(playerUuid) || null;
    if (game) {
      // Player was in a game
      this.endGame(game.uuid);
      return game;
    }

    this.connectedPlayers = this.connectedPlayers.filter(
      (player) => player.uuid !== playerUuid
    );
    logger.info(`Unregistered player with UUID: ${playerUuid}`);
    return null;
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
      this.updateUser(playerUuid, { status: PlayerStatus.WAITING });
      this.updateUser(matchedPlayer.uuid, { status: PlayerStatus.WAITING });

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
      (p) =>
        p.status === PlayerStatus.SEARCHING &&
        p.uuid !== playerUuid &&
        Math.abs(p.elo - player.elo) < MAX_ELO_DIFFERENCE
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

  public incrementPlayerScore(playerUuid: string): void {
    const player = this.getPlayerByUuid(playerUuid);
    if (player) {
      player.currentScore += 1;
      this.updateUser(playerUuid, { currentScore: player.currentScore });
    } else {
      logger.error(`Player with UUID ${playerUuid} not found`);
    }
  }
  public decrementPlayerScore(playerUuid: string): void {
    const player = this.getPlayerByUuid(playerUuid);
    if (player) {
      player.currentScore = Math.max(0, player.currentScore - 1);
      this.updateUser(playerUuid, { currentScore: player.currentScore });
    } else {
      logger.error(`Player with UUID ${playerUuid} not found`);
    }
  }

  public addProblemToGame(gameUuid: string, problem: Problem): void {
    const game = this.getGameByUuid(gameUuid);
    if (game) {
      game.problems.push(problem);
    } else {
      logger.error(`Game with UUID ${gameUuid} not found`);
    }
  }

  public getConnectedPlayers(): Player[] {
    return this.connectedPlayers;
  }

  public createGame(playerAUuid: string, playerBUuid: string): Game {
    const game: Game = {
      uuid: crypto.randomUUID(),
      players: [playerAUuid, playerBUuid],
      startedAt: new Date(),
      problems: [],
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

    const playerA = this.getPlayerByUuid(finishedGame.players[0]);
    const playerB = this.getPlayerByUuid(finishedGame.players[1]);

    if (!playerA || !playerB) {
      logger.error(`Players not found for game ${gameUuid}`);
      return null;
    }

    // Update the players' elo based on the game score
    const { playerARating, playerBRating } = EloHelperService.calculateElo(
      playerA.elo,
      playerB.elo,
      playerA.currentScore > playerB.currentScore,
      Math.abs(playerA.currentScore - playerB.currentScore)
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

  validateAnswer(
    playerUuid: string,
    gameUuid: string,
    answer: number
  ): boolean {
    const game = this.getGameByUuid(gameUuid);
    if (!game) {
      logger.error(`Game with UUID ${gameUuid} not found`);
      return false;
    }
    const player = this.getPlayerByUuid(playerUuid);
    if (!player) {
      logger.error(`Player with UUID ${playerUuid} not found`);
      return false;
    }
    const solution = game.problems[player.currentScore].solution;
    if (!solution) {
      logger.error(
        `No problem found for player ${playerUuid} in game ${gameUuid}`
      );
      return false;
    }

    return solution === answer;
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
  getGameByUuid(gameUuid: string): Game | null {
    return this.runningGames.find((game) => game.uuid === gameUuid) || null;
  }
}
