// --- Game Configuration ---
// Sets the current variant to Mini Baccarat and defines the participants
game = "MiniBac";
gameTitle = "Mini Baccarat";
opponents = ["playersHand", "bankersHand"];

/**
 * cardGroupsList: Defines how cards are logically grouped in the UI.
 * player: Gets the 1st and 3rd cards dealt (indexes 0, 2).
 * banker: Gets the 2nd and 4th cards dealt (indexes 1, 3).
 */
cardGroupsList = [
    { id:"player", name: "Player", cardIndexes: [0,2] },
    { id:"banker", name: "Banker", cardIndexes: [1,3] }
];

/**
 * handsList: Configuration for Baccarat Hand instances.
 * Includes logic for result strings and rule descriptions.
 */
handsList = [
    { id: "bankersHand", title: "Banker", cardGroups: ["banker"], cardType: 3, updateCardGroup: "banker",
        result: function (){ return handResult("bankersHand") } },
    { id: "playersHand", title: "Player", cardGroups: ["player"], cardType: 3, updateCardGroup: "player",
        result: function (){ return handResult("playersHand") } },
    { id: "playersRule", title: "Players Rule", cardGroups: ["player"], cardType: 0,
        result: function (){ return handRulePlayer("playersHand") } },
    { id: "bankersRule", title: "Bankers Rule", cardGroups: ["banker"], cardType: 0,
        result: function (){ return handRuleBanker() } }
];

/**
 * resultsList: Defines the quiz questions and correct answers for the UI.
 * Maps game outcomes (Winner, Bets, Side Bets) to their respective evaluation functions.
 */
resultsList = [
    { id: "winner", title: "Winner", options: ["Player", "Banker", "Tie"], result: function (){
            return winner; } },
    { id: "banker", title: "Banker bet", options: [...arrayWinLosePush], result: function (){
            return bankerBet(winner, hands["bankersHand"].is3Card7); } },
    { id: "player", title: "Player bet", options: [...arrayWinLosePush], result: function (){
            return playerBet(winner); } },
    { id: "tie", title: "Tie bet", options: [...arrayWinLose], result: function (){
            return tieBet(winner); } },
    { id: "goldenTalonsBanker", title: "Golden Talons (Banker)", options: [...arrayWinLose], result: function (){
            return goldenTalons(hands["bankersHand"].count, hands["playersHand"].count); } },
    { id: "goldenTalonsPlayer", title: "Golden Talons (Player)", options: [...arrayWinLose], result: function (){
            return goldenTalons(hands["playersHand"].count, hands["bankersHand"].count); } }
];

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Payout Verbiage & Logic                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/** Evaluates the Banker bet, handling commissions or specific variant pushes (Dragon/Sun 7) */
function bankerBet(winner, is3Card7){
    switch (winner){
        case "Banker":
            return game === "MiniBac" ? "Win - 95%:1" :
                (is3Card7 && game === "EzBac") ? "Push - Dragon 7" :
                    (is3Card7 && game === "EternalBac") ? "Push - Sun 7" : "Win 1:1";
        case "Natural Tie": return "Lose - Natural Tie";
        case "Tie": return "Push";
        default: return "Lose";
    }
}

/** Evaluates the Player bet (typically pays 1:1) */
function playerBet(winner){
    switch (winner){
        case "Player": return "Win 1:1";
        case "Natural Tie": return "Lose - Natural Tie";
        case "Tie": return "Push";
        default: return "Lose";
    }
}

/** Evaluates the Tie bet (typically pays 8:1) */
function tieBet(winner){
    switch (winner){
        case "Tie": return "Win 8:1";
        default: return "Lose";
    }
}

/** Returns the score and "natural" status for a hand */
function handResult(handName){
    return `${hands[handName].count} ${hands[handName].isNatural ? "(natural)" : ""}`.trim();
}

/** Explains the Player's drawing rule: Stand on 6-7, Draw on 0-5 */
function handRulePlayer(handName){
    if(hands["playersHand"].isNatural){ return "Player has a natural - Stand"; }
    if(hands["bankersHand"].isNatural){ return "Banker has a natural - Stand"; }
    let twoCardCount = hands[handName].twoCardCount;
    return "Count was "+twoCardCount+ (twoCardCount <= 5 ? " < less then 6 - Draw Card" : " > greater then 5 - Stand");
}

/**
 * Explains the Banker's drawing rule (The Tableau).
 * Decision depends on Banker's 2-card total and the value of the Player's 3rd card.
 */
function handRuleBanker(){
    if(hands["bankersHand"].isNatural){ return "Banker has a natural - Stand"; }
    if(hands["playersHand"].isNatural){ return "Player has a natural - Stand"; }

    // If player didn't draw a 3rd card, Banker uses the standard Player Rule
    if(!hands["playersHand"].has3rdCard){ return "Use Player Rule: " + handRulePlayer("bankersHand"); }

    let p3c = hands["playersHand"].get3rdCardOrNull;
    let twoCardCount = hands["bankersHand"].twoCardCount;

    switch(twoCardCount){
        case 0: case 1: case 2: return "Count was "+twoCardCount+" < less then 3 - Draw Card";
        case 3: return p3c !== 8 ?
            "Count was 3 and Player's 3rd card is not 8 - Draw" :
            "Count was 3 and Player's 3rd card is 8 - Stand";
        case 4: return p3c <= 7 && p3c >= 2 ?
            "Count was 4 and Player's 3rd card is 2 through 7 - Draw" :
            "Count was 4 and Player's 3rd card is not 2 through 7 - Stand";
        case 5: return p3c <= 7 && p3c >= 4 ?
            "Count was 5 and Player's 3rd card is 4 through 7 - Draw" :
            "Count was 5 and Player's 3rd card is not 4 through 7 - Stand";
        case 6: return p3c <= 7 && p3c >= 6 ?
            "Count was 6 and Player's 3rd card is 6 or 7 - Draw" :
            "Count was 6 and Player's 3rd card is not 6 or 7 - Stand";
        default:
            return "Count was "+twoCardCount+" > greater than 6 - Stand";
    }
}

/** Calculates Golden Talons side bet based on the point spread between hands */
function goldenTalons(hand1Count, hand2Count){
    switch(Number(hand1Count - hand2Count)){
        case 9: return "Win-9 - 30:1";
        case 8: return "Win-8 - 10:1";
        case 7: return "Win-7 - 6:1";
        case 6: return "Win-6 - 4:1";
        case 5: return "Win-5 - 2:1";
        case 4: return "Win-4 - 1:1";
        default: return "Lose";
    }
}

/** Checks for Dragon 7 / Sun 7 specific side bet wins */
function banker7Bet(winner, is3Card7){
    return (winner === "Banker" && is3Card7 && (eternalBets = true)) ? "Win 40:1" : "Lose";
}

/** Checks for Panda 8 / Moon 8 specific side bet wins */
function player8Bet(winner, is3Card8){
    return (winner === "Player" && is3Card8 && (eternalBets = true)) ? "Win 25:1" : "Lose";
}
