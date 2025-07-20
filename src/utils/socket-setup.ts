import { Server } from "socket.io";
import { logger } from "../loggers/logger";
import { GameManagerService } from "../services/game-manager.service";
import { ProblemService } from "../services/problem.service";
import { PlayerConnectedDto } from "../dto/ws/player-connected.dto";

let ioServer: Server | null = null;

/**
 * Messages websockets
 * - PlayerConnected: Player connected to the server
 * - PlayerDisconnected: Player disconnected from the server
 * - PlayerUpdated: Player data updated (e.g., elo, status)
 * - PlayerAnswered: Player answered a game question
 * - GameCreated: Game created with player UUIDs
 * - GameEnded: Game ended with the final score
 * - GameUpdated: Game updated with new score or status
 *
 * Server emits:
 * - PlayerConnected // {success: boolean, player :Player}
 * - PlayerDisconnected // {success: boolean}
 * - PlayerUpdated // {player: Player}
 * - PlayerAnswerResult // {success: boolean, nextProblem?: Problem}
 * - GameCreated // {playersLogins: string[2], playersElo: number[2], gameUuid: string}
 * - GameStart // {problem: Problem, startedAt: Date}
 * - GameEnded // {gameScore: GameScore}
 * - Leaderboard // {players: [
 * { login: string, elo: number, isInGame: boolean }]}
 *
 * Client emits:
 * - connection // {login: string} : OK
 * - PlayerAnswer // {uuid: string, answer: number}
 * - PlayerSearchGame // {uuid: string} : OK
 * - Leaderboard // {}
 *
 *
 *
 *
 * Flow:
 * 1. Player connects to the server and registers.
 * 2. Player can search for a game, which changes their status to 'searching'.
 * 3. When a game is created, players are added to the game and their status is updated to 'playing'.
 * 4. When a game ends, players' elo ratings are updated based on the game score, and their status is set to 'connected'.
 *
 */

const socketMessages = {
  PlayerConnected: "PlayerConnected",
  PlayerDisconnected: "PlayerDisconnected",
  PlayerUpdated: "PlayerUpdated",
  PlayerAnswered: "PlayerAnswered",
  GameCreated: "GameCreated",
  GameEnded: "GameEnded",
  GameUpdated: "GameUpdated",
  PlayerSearchGame: "PlayerSearchGame",
  PlayerAnswer: "PlayerAnswer",
  GameStart: "GameStart",
  PlayerAnswerResult: "PlayerAnswerResult",
  Leaderboard: "Leaderboard",
};

const playerSockets: Map<string, string> = new Map();

export async function setupWebSocket(io: Server) {
  if (!io) {
    logger.error("Socket.io server instance is not provided");
    return;
  }

  io.on("connection", async (socket) => {
    logger.info(`New client connected: ${socket.id}`);

    if (!socket.handshake.query.login) {
      logger.error("Connection attempt without login");
      socket.disconnect();
      return;
    }
    logger.info(`Player connected: ${socket.handshake.query.login}`);

    const player = GameManagerService.getInstance().registerPlayer(
      socket.handshake.query.login as string
    );
    playerSockets.set(player.uuid, socket.id);
    socket.join(player.uuid);

    const playerConnectedDto: PlayerConnectedDto = {
      success: true,
      player: {
        uuid: player.uuid,
        login: player.login,
        elo: player.elo,
        status: player.status,
      },
    };
    socket.emit(socketMessages.PlayerConnected, playerConnectedDto);

    socket.on(socketMessages.Leaderboard, () => {
      const leaderboard = GameManagerService.getInstance().getLeaderboard();
      socket.emit(socketMessages.Leaderboard, { leaderboard });
    });

    /**
     * On player search for a game
     */
    socket.on(socketMessages.PlayerSearchGame, async (data) => {
      const playerUuid = data.uuid;

      if (!playerUuid) {
        logger.error(
          `${socketMessages.PlayerSearchGame} event received without UUID`
        );
        return;
      }

      logger.info(`Player ${playerUuid} searching for a game`);
      const game =
        GameManagerService.getInstance().playerSearchGame(playerUuid);

      if (game === false) {
        logger.info(`Player ${playerUuid} not found or not searching`);
        socket.disconnect();
      } else if (game === true) {
        const player =
          GameManagerService.getInstance().getPlayerByUuid(playerUuid);
        socket.emit(socketMessages.PlayerUpdated, { player });
      } else {
        game.players.forEach((uuid) => {
          io.to(uuid).emit(socketMessages.GameCreated, {
            playersLogins: game.players.map(
              (u) => GameManagerService.getInstance().getPlayerByUuid(u)?.login
            ),
            playersElo: game.players.map(
              (u) => GameManagerService.getInstance().getPlayerByUuid(u)?.elo
            ),
            gameUuid: game.uuid,
          });
        });

        setTimeout(() => {
          const problem = ProblemService.getInstance().createProblemForGame(
            game.uuid
          );

          if (problem) {
            game.players.forEach((uuid) => {
              io.to(uuid).emit(socketMessages.GameStart, {
                problem: {
                  uuid: problem.uuid,
                  title: problem.title,
                  difficulty: problem.difficulty,
                  description: problem.description,
                },
                startedAt: new Date(),
              });
            });
          }

          setTimeout(() => {
            const endedGame = GameManagerService.getInstance().endGame(
              game.uuid
            );
            const playerA = GameManagerService.getInstance().getPlayerByUuid(
              game.players[0]
            );
            const playerB = GameManagerService.getInstance().getPlayerByUuid(
              game.players[1]
            );
            if (!endedGame || !playerA || !playerB) {
              logger.error(`Failed to end game ${game.uuid}`);
              return;
            }
            if (endedGame) {
              game.players.forEach((uuid) => {
                io.to(uuid).emit(socketMessages.GameEnded, {
                  0: {
                    login: playerA.login,
                    elo: playerA.elo,
                    score: playerA.currentScore,
                  },
                  1: {
                    login: playerB.login,
                    elo: playerB.elo,
                    score: playerB.currentScore,
                  },
                });
              });
            } else {
              logger.error(`Failed to end game ${game.uuid}`);
            }
          }, 60 * 1000); // Timeout for game end after 60 seconds
        }, 5 * 1000); // Timeout for game start after 5 seconds
      }
    });

    socket.on(socketMessages.PlayerAnswer, async (data) => {
      const playerUuid = data.uuid;
      const game =
        GameManagerService.getInstance().getUserCurrentGame(playerUuid);
      const answer = data.answer;

      if (!game) {
        logger.error(`Player ${playerUuid} is not in a game`);
        return;
      }

      if (!playerUuid || answer === undefined) {
        logger.error(
          `${socketMessages.PlayerAnswer} event received without UUID or answer`
        );
        return;
      }

      logger.info(`Player ${playerUuid} answered with ${answer}`);
      if (
        GameManagerService.getInstance().validateAnswer(
          playerUuid,
          game.uuid,
          answer
        )
      ) {
        GameManagerService.getInstance().incrementPlayerScore(playerUuid);

        const nextProblem =
          ProblemService.getInstance().getOrCreateProblemForGame(game.uuid);
        if (nextProblem) {
          io.to(playerUuid).emit(socketMessages.PlayerAnswerResult, {
            success: true,
            nextProblem: {
              uuid: nextProblem.uuid,
              title: nextProblem.title,
              difficulty: nextProblem.difficulty,
              description: nextProblem.description,
            },
          });

          const playerA = GameManagerService.getInstance().getPlayerByUuid(
            game.players[0]
          );
          const playerB = GameManagerService.getInstance().getPlayerByUuid(
            game.players[1]
          );
          if (!playerA || !playerB) {
            logger.error(`Failed to find players for game ${game.uuid}`);
            return;
          }

          game.players.forEach((uuid) => {
            io.to(uuid).emit(socketMessages.GameUpdated, {
              score: {
                0: {
                  login: playerA.login,
                  elo: playerA.elo,
                  score: playerA.currentScore,
                },
                1: {
                  login: playerB.login,
                  elo: playerB.elo,
                  score: playerB.currentScore,
                },
              },
            });
          });
        } else {
          logger.error(`No next problem found for game ${game?.uuid}`);
        }
      } else {
        logger.info(`Player ${playerUuid} answered incorrectly`);
        io.to(playerUuid).emit(socketMessages.PlayerAnswerResult, {
          success: false,
        });
      }
    });

    io.on("disconnect", () => {
      const game = GameManagerService.getInstance().getUserCurrentGame(
        player.uuid
      );

      if (!game) {
        logger.info(`Player ${player.uuid} disconnected, not in a game`);
        playerSockets.delete(player.uuid);
        socket.leave(player.uuid);
        return;
      }

      const playerA = GameManagerService.getInstance().getPlayerByUuid(
        game.players[0]
      );
      const playerB = GameManagerService.getInstance().getPlayerByUuid(
        game.players[1]
      );
      if (!playerA || !playerB) {
        logger.error(`Failed to find players for game ${game.uuid}`);
        return;
      }
      const endedGame = GameManagerService.getInstance().unregisterPlayer(
        player.uuid
      );
      if (endedGame) {
        // Player was in game

        logger.info(`Player ${player.uuid} disconnected, stopping game`);
        game.players.forEach((uuid) => {
          io.to(uuid).emit(socketMessages.GameEnded, {
            0: {
              login: playerA.login,
              elo:
                GameManagerService.getInstance().getPlayerByUuid(playerA.uuid)
                  ?.elo || 0,
              score:
                GameManagerService.getInstance().getPlayerByUuid(playerA.uuid)
                  ?.currentScore || 0,
            },
            1: {
              login: playerB.login,
              elo:
                GameManagerService.getInstance().getPlayerByUuid(playerB.uuid)
                  ?.elo || 0,
              score:
                GameManagerService.getInstance().getPlayerByUuid(playerB.uuid)
                  ?.currentScore || 0,
            },
          });
        });
      }
      playerSockets.delete(player.uuid);
      socket.leave(player.uuid);
    });
  });
}
