// --- Game Configuration ---
game = "EternalBac";
gameTitle = "Eternal Bac";

/**
 * Extend the resultsList with specialized Eternal Baccarat side bets.
 * These involve high-payout scenarios for specific scores like 7s and 9s.
 */
resultsList.push(...[
    { id: "sun7", title: "Sun 7", options: [...arrayWinLose],
        result: function (){ return banker7Bet(winner, hands["bankersHand"].is3Card7); } },
    { id: "moon8", title: "Moon 8", options: [...arrayWinLose],
        result: function (){ return player8Bet(winner, hands["playersHand"].is3Card8); } },
    { id: "supreme7", title: "Supreme 7", options: [...arrayWinLose],
        result: function (){
            // Logic splits between a 3-card 7 vs 7 and a 2-card 7 vs 7
            if(hands["playersHand"].has3rdCard){
                return supreme7Bet3Card(winner, hands["bankersHand"].is3Card7, hands["playersHand"].is3Card7);
            } else {
                return supreme7Bet2Card(winner, hands["bankersHand"].is2Card7, hands["playersHand"].is2Card7);
            }
        }},
    { id: "divine9", title: "Divine 9", options: [...arrayWinLose],
        result: function (){
            return divine9Bet(winner, hands["bankersHand"].is3Card9, hands["playersHand"].is3Card9);
        }},
    { id: "eclipse", title: "Eclipse", options: [...arrayWinLose],
        result: function (){ return eclipseBet(); } }
]);

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Payout Verbiage & Special Side Bet Logic                                                        //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/** Payout for a 3-card Tie on 7 (highest Supreme 7 tier) */
function supreme7Bet3Card(winner, bankerIs3Card7, playerIs3Card7){
    return (winner === "Tie" && bankerIs3Card7 && playerIs3Card7 && (eternalBets = true)) ? "Win 200:1" : "Lose";
}

/** Payout for a 2-card Tie on 7 (lower Supreme 7 tier) */
function supreme7Bet2Card(winner, bankerIs2Card7, playerIs2Card7){
    return ((winner === "Tie" || winner === "Natural Tie") &&
        bankerIs2Card7 && playerIs2Card7 && (eternalBets = true)) ? "Win 50:1" : "Lose";
}

/**
 * Divine 9: Pays if the round results in a Tie involving at least one 3-card 9.
 * 75:1 if both are 3-card 9s, 10:1 if only one is.
 */
function divine9Bet(winner, bankerIs3Card9, playerIs3Card9){
    if(winner !== "Tie") { return "Lose"; }
    switch(true){
        case bankerIs3Card9 && playerIs3Card9:
            eternalBets = true;
            return "Win 75:1";
        case bankerIs3Card9 || playerIs3Card9:
            eternalBets = true;
            return "Win 10:1";
        default:
            return "Lose";
    }
}

/**
 * Eclipse Bet: A "catch-all" side bet that pays if ANY other
 * Eternal Baccarat side bet (Sun, Moon, Supreme, Divine) was a winner.
 */
function eclipseBet(){
    return eternalBets ? "Win 6:1" : "Lose";
}
