// État d’un joueur connecté
export enum PlayerStatus {
  CONNECTED = "connected",
  SEARCHING = "searching",
  WAITING = "waiting",
  PLAYING = "playing",
}

// Joueur
export interface Player {
  readonly uuid: string;
  readonly login: string;
  elo: number;
  currentScore: number;
  status: PlayerStatus;
}

// Problème à résoudre
export interface Problem {
  readonly uuid: string;
  readonly title: string;
  readonly description: string;
  readonly difficulty: number;
  readonly solution: number;
}

// Partie en cours
export interface Game {
  readonly uuid: string;
  readonly startedAt: Date;
  readonly difficulty?: number;
  players: string[];
  problems: Problem[];
}
