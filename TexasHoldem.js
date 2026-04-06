// --- Game Configuration ---
game = "TexasHoldem";
gameTitle = "Texas Hold\'em";
// Standard PvP setup: Two players competing against each other
opponents = ["playersHand", "playersHand2"];

/**
 * cardGroupsList: Defines the layout for a standard Hold'em table.
 * Player 1: 2 hole cards (indexes 5, 6).
 * Community: The shared 5-card board (indexes 0-4).
 * Player 2: 2 hole cards (indexes 7, 8).
 */
cardGroupsList = [
    { id:"player", name: "Player 1", cardIndexes: [5,6] },
    { id:"community", name: "Community Board", cardIndexes: [0,1,2,3,4] },
    { id:"player2", name: "Player 2", cardIndexes: [7,8] }
];

/**
 * handsList: Poker hand definitions.
 * Both players evaluate their best 5-card hand using their 2 hole cards
 * combined with the 5 community cards.
 */
handsList = [
    { id: "playersHand", title: "Player 1", cardType: 5, cardGroups: ["player","community"],
        result: function (){ return getHandCodeDescription(hands["playersHand"], 5); } },
    { id: "playersHand2", title: "Player 2", cardType: 5, cardGroups: ["player2","community"],
        result: function (){ return getHandCodeDescription( hands["playersHand2"], 5); } }
];

/**
 * resultsList: Quiz questions for the UI.
 * Primarily determines the winner between the two competing player hands.
 */
resultsList = [
    { id: "winner", title: "Winner", options: ["Player 1", "Player 2", "Push"], result: function (){
            return winner; } }
];

