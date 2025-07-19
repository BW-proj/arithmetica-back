export class EloHelperService {
  private static readonly K_FACTOR = 32;

  // returns the new Elo rating after a game for playerA and playerB
  public static calculateElo(
    playerARating: number,
    playerBRating: number,
    playerAWin: boolean,
    scoreDifference: number = 0
  ): { playerARating: number; playerBRating: number } {
    const expectedScoreA =
      1 / (1 + Math.pow(10, (playerBRating - playerARating) / 400));
    const expectedScoreB =
      1 / (1 + Math.pow(10, (playerARating - playerBRating) / 400));

    const actualScoreA = playerAWin ? 1 : 0;
    const actualScoreB = playerAWin ? 0 : 1;

    const newRatingA =
      playerARating +
      EloHelperService.K_FACTOR * (actualScoreA - expectedScoreA);
    const newRatingB =
      playerBRating +
      EloHelperService.K_FACTOR * (actualScoreB - expectedScoreB);

    // Adjust ratings based on score difference
    const adjustedRatingA = newRatingA + scoreDifference * 0.1; // Example adjustment factor
    const adjustedRatingB = newRatingB - scoreDifference * 0.1; // Example adjustment factor

    return {
      playerARating: Math.round(adjustedRatingA),
      playerBRating: Math.round(adjustedRatingB),
    };
  }
}
