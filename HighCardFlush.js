// --- Game Configuration ---
game = "HighCardFlush";
gameTitle = "High Card Flush";
opponents = ["playersHand", "dealersHand"];

/**
 * cardGroupsList: Defines the 7-card deal for both sides.
 */
cardGroupsList = [
    { id:"player", name: "Player", cardIndexes: [0,1,2,3,4,5,6] },
    { id:"dealer", name: "Dealer", cardIndexes: [7,8,9,10,11,12,13] }
];

/**
 * resultsList: Quiz questions for the user interface.
 * Tracks dealer qualification (3-card 9-high or better), winners, and payouts.
 */
resultsList = [
    { id: "qualify", title: "Dealer Qualified", options: [...arrayYesNo], result: function (){
            return qualified ? "Yes" : "No" } },
    { id: "winner", title: "Winner", options: ["Player", "Dealer", "Push"], result: function (){
            return winner; } },
    { id: "anteBet", title: "Ante", options: [...arrayWinLosePush], result: function (){
            return betPayout(winner, true); } },
    { id: "raiseBet", title: "Raise", options: [...arrayWinLosePush], result: function (){
            return betPayout(winner, qualified); } },
    { id: "flushBet", title: "Flush", options: [...arrayWinLose], result: function (){
            return flushBet(hands["playersHand"].cardsCount); } },
    { id: "straightFlushBet", title: "Straight Flush", options: [...arrayWinLose], result: function (){
            return straightFlushBet(hands["straightFlush"].cardsCount); } }
];

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Payout Verbiage & Logic                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/** Formats the hand description by showing the max flush length and card faces */
function handResult(handName){
    const { cards, cardsCount, faceValues } = hands[handName];
    return cards.length > 0 ? `${cardsCount} Card: ${cards[0].icon} ${faceValues.toString()}`.trim() : "None";
}

/** Standard bet payout: Raise pushes if the dealer fails to qualify */
function betPayout(winner, qualified){
    switch (winner){
        case "Push": return "Push";
        case "Dealer": return "Lose";
        case "Player": return qualified ? "Win - 1-1" : "Push";
    }
}

/** Side bet for the length of the player's longest flush */
function flushBet(bestCardPlay){
    switch(bestCardPlay){
        case 7: return "Win - 7 Card 300:1";
        case 6: return "Win - 6 Card 100:1";
        case 5: return "Win - 5 Card 10:1";
        case 4: return "Win - 4 Card 1:1";
        default: return "Lose";
    }
}

/** High-payout side bet for the length of a straight flush within the same suit */
function straightFlushBet(bestCardPlay){
    switch(bestCardPlay){
        case 7: return "Win - 7 Card 1000:1";
        case 6: return "Win - 6 Card 500:1";
        case 5: return "Win - 5 Card 100:1";
        case 4: return "Win - 4 Card 75:1";
        case 3: return "Win - 3 Card 7:1";
        default: return "Lose";
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Overrides & Core Game Logic                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Custom deal logic for High Card Flush.
 * Finds the maximum suited group for Player and Dealer before instantiating hands.
 */
function deal(){
    createCardGroups();
    createResults();

    // Pre-calculate the best suited hands to pass into the Hand constructor
    handsList = [
        { id: "playersHand", title: "Player", cardType: 0, cardGroups: ["player"],
            cards: groupCardsBySuit(getCardsArray("player"))[0][1],
            result: function (){ return handResult("playersHand"); }},
        { id: "dealersHand", title: "Dealer", cardType: 0, cardGroups: ["dealer"],
            cards: groupCardsBySuit(getCardsArray("dealer"))[0][1],
            result: function (){ return handResult("dealersHand"); }},
        { id: "straightFlush", title: "Straight Flush", cardType: 0, cardGroups: ["straightFlush"],
            cards: getStraightFlush("player"),
            result: function (){ return handResult("straightFlush"); }}
    ];

    createHands(PokerHand);

    qualified = doesHandQualify(hands[opponents[1]]);

    /** Determines winner based on flush length, then high-card tiebreakers */
    winner = (function() {
        let hand1 = hands["dealersHand"], hand2 = hands["playersHand"];
        if (hand1.cardsCount === hand2.cardsCount) {
            for (let i= 0; i < hand1.cardsCount; i++){
                if(hand1.cards[i].value!==hand2.cards[i].value){
                    return hand1.cards[i].value < hand2.cards[i].value ? "Player" : "Dealer";
                }
            }
            return "Push";
        }
        return hand1.cardsCount < hand2.cardsCount ? "Player" : "Dealer";
    })();
}

/** Retrieves the first suited group that qualifies as a straight flush */
function getStraightFlush(cardGroupName){
    const results = groupCardsBySuit(getCardsArray(cardGroupName));
    let straightFlush = [];
    for(let result of results){
        if(result[2]){ straightFlush = result[1]; break; }
    }
    return straightFlush;
}

/**
 * Organizes cards by suit and determines which suit has the most cards.
 * Returns an array of [SuitName, CardArray, IsStraight] sorted by strength.
 */
function groupCardsBySuit (cards){
    const initialSuits = { Spades: [], Clubs: [], Hearts: [], Diamonds: [] };

    const checkStraight = (suitCards) => {
        if (suitCards.length < 3) return false;
        const targetWheel = ["A", ...Array.from({ length: suitCards.length - 1 }, (_, i) => (i + 2).toString())];
        const isWheel = targetWheel.every(val => suitCards.some(c => c.face === val));
        if (isWheel) return true;

        const values = [...new Set(suitCards.map(c => c.value))].sort((a, b) => a - b);
        if (values.length !== suitCards.length) return false;
        return (values[values.length - 1] - values[0]) === (values.length - 1);
    };

    const groups = cards.reduce((acc, card) => {
        if (acc[card.suit]) acc[card.suit].push(card);
        return acc;
    }, initialSuits);

    return Object.entries(groups)
        .map(([suit, suitCards]) => {
            suitCards.sort((a, b) => b.value - a.value);
            const isStraight = checkStraight(suitCards);
            return [suit, suitCards, isStraight];
        })
        .sort((a, b) => {
            const cardsA = a[1], cardsB = b[1];
            // Primary: Number of cards in suit
            if (cardsB.length !== cardsA.length) return cardsB.length - cardsA.length;
            // Secondary: High card comparison
            for (let i = 0; i < cardsA.length; i++) {
                if (cardsB[i].value !== cardsA[i].value) return cardsB[i].value - cardsA[i].value;
            }
            return 0;
        });
}
