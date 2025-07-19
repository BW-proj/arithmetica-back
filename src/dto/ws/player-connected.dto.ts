export interface PlayerConnectedDto {
  success: boolean;
  player: {
    uuid: string;
    login: string;
    elo: number;
    status: string;
  };
}
