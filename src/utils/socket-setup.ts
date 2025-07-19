import { Server } from "socket.io";
import { logger } from "../loggers/logger";
import { GameManagerService } from "../services/game-manager.service";

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
 *
 * Client emits:
 * - connection // {login: string}
 * - PlayerAnswer // {uuid: string, answer: number}
 * - PlayerSearchGame // {uuid: string}
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

    socket.emit("PlayerConnected", { success: true, player: player });

    socket.on("PlayerSearchGame", async (data) => {
      const playerUuid = data.uuid;

      if (!playerUuid) {
        logger.error("PlayerSearchGame event received without UUID");
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
        socket.emit("PlayerUpdated", { player });
      } else {
        socket.emit("GameCreated", {
          playersLogins: game.players.map((uuid) =>
            GameManagerService.getInstance().getPlayerByUuid(uuid)
          ),
          playersElo: game.players.map(
            (uuid) =>
              GameManagerService.getInstance().getPlayerByUuid(uuid)?.elo
          ),
          gameUuid: game.uuid,
        });
      }
    });
  });
}
