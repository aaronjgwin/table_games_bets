// --- Game Configuration ---
// Sets the current variant to EZ Baccarat
game = "EzBac";
gameTitle = "EZ Bac";

/**
 * Extend the resultsList with EZ Baccarat specific side bets.
 * These are the most common side bets for this variant, focusing on 3-card winning totals.
 */
resultsList.push(...[
    {
        id: "dragon7",
        title: "Dragon 7",
        options: [...arrayWinLose],
        // Banker wins with a 3-card total of 7
        result: function (){ return banker7Bet(winner, hands["bankersHand"].is3Card7); }
    },
    {
        id: "panda8",
        title: "Panda 8",
        options: [...arrayWinLose],
        // Player wins with a 3-card total of 8
        result: function (){ return player8Bet(winner, hands["playersHand"].is3Card8); }
    }
]);
