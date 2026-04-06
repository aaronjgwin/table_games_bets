// --- Game Configuration ---
game = "Blackjack";
gameTitle = "Blackjack";
opponents = ["playersHand", "dealersHand"];

/**
 * cardGroupsList: Maps deck positions to UI sections.
 * player: Initial 2 cards (indexes 0, 2).
 * dealer: Initial 2 cards (indexes 1, 3).
 */
cardGroupsList = [
    { id:"player", name: "Player", cardIndexes: [0,2] },
    { id:"dealer", name: "Dealer", cardIndexes: [1,3] }
];

/**
 * handsList: Defines logic for various Blackjack hand types and strategy hints.
 */
handsList = [
    { id: "dealersHand", title: "Dealer", cardType: 2, cardGroups: ["dealer"],
        result: function (){ return handResult("dealersHand"); } },
    { id: "playersHand", title: "Player", cardType: 2, cardGroups: ["player"],
        result: function (){ return handResult("playersHand"); } },
    // Bonus hand uses specific cards from both player and dealer for side bets
    { id: "bonusHand", title: "Bonus Bets", cardType: 3, cardGroups: ["player", "dealer"],
        ignore: { cardIndexes:[0,1,2] }, // Logic to pick specific cards for 3-card poker side bets
        result: function (){ return getHandCodeDescription(hands["bonusHand"], 3); } },
    { id: "basicStrategy", title: "Basic Strategy", cardType: 0, cardGroups: ["player"],
        result: function (){ return basicStrategyExplanation(); } }
];

/**
 * resultsList: The quiz questions generated for the user interface.
 */
resultsList = [
    { id: "winner", title: "Winner", options: ["Player", "Dealer", "Push"], result: function (){
            return winner; } },
    { id: "insurance", title: "Insurance", options: [...arrayWinLose, "Not Offered"], result: function (){
            return insurance(); } },
    { id: "top3", title: "Top 3", options: [...arrayWinLose], result: function (){
            return top3(hands["bonusHand"].bestCardPlay); } },
    { id: "plus3", title: "Plus 3", options: [...arrayWinLose], result: function (){
            return plus3(hands["bonusHand"].bestCardPlay); } },
    { id: "plus3Exterme", title: "Plus 3 Exterme", options: [...arrayWinLose], result: function (){
            return plus3Exterme(hands["bonusHand"].bestCardPlay); } }
];


/////////////////////////////////////////////////////////////////////////////////////////////////////
// Payout Verbiage & Rules                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Constructs a descriptive string for the hand's final state.
 * Includes score, bust status, Blackjack status, and Double Down markers.
 */
function handResult(handName){
    return `${hands[handName].score} ${hands[handName].isBusted ? "(busted)" : ""}
        ${hands[handName].isBlackjack ? "(Blackjack)" : ""}
        ${handName === "playersHand" && rotateCard ? "(doubled down)" : ""}`.trim();
}

/**
 * Insurance logic: Only offered if Dealer Up-card is an Ace.
 * Pays 2:1 if the dealer actually has Blackjack.
 */
function insurance(){
    if(!hands["dealersHand"].isFirstCardAce){ return "Not Offered"; }
    return hands["dealersHand"].isBlackjack ? "Win 2:1" : "Lose";
}

/** Evaluates high-tier 3-card side bets (Top 3) */
function top3(bestCardPlay){
    switch(bestCardPlay){
        case 1.5: return "Win - Three-of-a-Kind Suited 270:1";
        case 2: return "Win - Straight Flush 180:1";
        case 5: return "Win - Three-of-a-Kind 90:1";
        default: return "Lose";
    }
}

/** Evaluates standard 21+3 side bets */
function plus3(bestCardPlay){
    switch(bestCardPlay){
        case 2: return "Win - Straight Flush 9:1";
        case 5: return "Win - Three-of-a-Kind 9:1";
        case 6: return "Win - Straight 9:1";
        case 7: return "Win - Flush 9:1";
        default: return "Lose";
    }
}

/** Evaluates high-volatility 21+3 side bets (Extreme variant) */
function plus3Exterme(bestCardPlay){
    switch(bestCardPlay){
        case 2: return "Win - Straight Flush 30:1";
        case 5: return "Win - Three-of-a-Kind 20:1";
        case 6: return "Win - Straight 10:1";
        case 7: return "Win - Flush 5:1";
        default: return "Lose";
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Overrides                                                                                       //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Custom deal function for Blackjack.
 * Instantiates specific classes based on hand index (Player/Dealer vs. Bonus).
 */
function deal(){
    createCardGroups();
    createResults();

    // Logic-based instantiation: Index 2 (Bonus) becomes a PokerHand, others are BlackjackHands
    createHands(i => (i === 2 ? PokerHand : BlackjackHand));

    // Automated play-through of the player's and dealer's logic
    if("playersHand" in hands && "dealersHand" in hands){
        playBlackjack(hands["playersHand"], hands["dealersHand"]);
    }

    /** Calculates the final game winner based on standard Blackjack comparison rules */
    winner = (function() {
        let hand1 = hands["dealersHand"], hand2 = hands["playersHand"];

        if (hand2.isBusted) { return "Dealer"; }
        if (hand1.isBusted) { return "Player"; }
        if (hand1.score === hand2.score) { return "Push"; }

        // Closer to 21 wins
        return hand1.score < hand2.score ? "Player" : "Dealer";
    })();
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Basic Strategy Explanation                                                                      //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Returns a formatted string combining the recommended action and the mathematical reason.
 */
function basicStrategyExplanation(){
    let explanation = getBasicStrategyExplanation();
    return explanation.action+": "+explanation.reason;
}

/**
 * Detailed decision engine for Blackjack Basic Strategy.
 * Evaluates the player's current total vs. the dealer's visible up-card.
 */
function getBasicStrategyExplanation() {
    let playersHand = hands["playersHand"];
    let dealersHand = hands["dealersHand"];

    const cards = [ playersHand.cards[0], playersHand.cards[1] ];
    const dealerVal = dealersHand.isFirstCardAce ? 11 : dealersHand.cards[0].points;
    const playerTotal = cards.reduce((accumulator, card) => { return accumulator + card.points; }, 0);

    // Immediate exit if player has 21
    if(playerTotal===21){ return { action: 'Blackjack', reason:'Yeah!' }; }

    const is2Cards = true; // Strategy explanations usually focus on initial 2-card state
    const isPair = is2Cards && cards[0].face === cards[1].face;
    const hasAce = playersHand.hasAce;


    // --- 1. PAIRS STRATEGY ---
    if (isPair) {
        const pairFace = cards[0].face;

        if (pairFace === '4' && (dealerVal === 5 || dealerVal === 6)) {
            return { action: 'Split', reason: `Pair of 4s against Dealer ${dealerVal}` };
        } else if (['4', '5', '10', 'J', 'Q', 'K'].includes(pairFace)) {
            // These pairs should be played as "Hard Totals" (e.g., 5,5 is a Hard 10)
        } else if (pairFace === '9' && (dealerVal === 7 || dealerVal >= 10)) {
            // Stand logic handled in Hard Totals
        } else if (pairFace === '6' && dealerVal >= 7) {
            // Hit logic handled in Hard Totals
        } else if (['2', '3', '7'].includes(pairFace) && dealerVal >= 8) {
            // Hit logic handled in Hard Totals
        } else {
            return { action: 'Split', reason: `Always split pair of ${pairFace}s (except on specific dealer high cards)` };
        }
    }

    // --- 2. SOFT TOTALS (Hands containing an Ace) ---
    if (hasAce && is2Cards) {
        const otherCard = cards.find(c => c.face !== 'A');
        const otherVal = otherCard ? otherCard.points : 1; // Corrects for AA

        if (otherVal >= 8) { // Soft 19 or 20
            if (otherVal === 8 && dealerVal === 6) return { action: 'Double', reason: `Soft 19 against Dealer 6` };
            return { action: 'Stand', reason: `Soft ${10 + otherVal} is a strong holding` };
        }
        if (otherVal === 7) { // Soft 18
            if (dealerVal === 7 || dealerVal === 8) return { action: 'Stand', reason: `Soft 18 stands against Dealer ${dealerVal}` };
            if (dealerVal >= 2 && dealerVal <= 6) return { action: 'Double', reason: `Soft 18 doubles against Dealer ${dealerVal}` };
            return { action: 'Hit', reason: `Soft 18 hits against Dealer ${dealerVal}` };
        }
        // Doubling rules for weak Soft hands vs. weak Dealer cards
        if (otherVal === 6 && (dealerVal >= 3 && dealerVal <= 6)) return { action: 'Double', reason: `Soft 17 doubles against Dealer 3-6` };
        if ((otherVal === 4 || otherVal === 5) && (dealerVal >= 4 && dealerVal <= 6)) return { action: 'Double', reason: `Soft 15/16 doubles against Dealer 4-6` };
        if ((otherVal === 2 || otherVal === 3) && (dealerVal === 5 || dealerVal === 6)) return { action: 'Double', reason: `Soft 13/14 doubles against Dealer 5-6` };

        return { action: 'Hit', reason: `Soft ${10 + otherVal} always hits against Dealer ${dealerVal}` };
    }

    // --- 3. HARD TOTALS (Standard point-based strategy) ---
    if (playerTotal >= 17) return { action: 'Stand', reason: `Hard ${playerTotal} always stands` };

    // Standing on "Stiff" hands (13-16) when dealer shows a likely bust card
    if (playerTotal >= 13 && playerTotal <= 16 && (dealerVal >= 2 && dealerVal <= 6)) {
        return { action: 'Stand', reason: `Player Total ${playerTotal} stands against Dealer bust cards (2-6)` };
    }

    if (playerTotal === 12 && (dealerVal >= 4 && dealerVal <= 6)) {
        return { action: 'Stand', reason: `Player 12 stands against Dealer 4, 5, or 6` };
    }

    // Math for Doubling on 9, 10, or 11
    if (playerTotal === 11) {
        return is2Cards
            ? { action: 'Double', reason: 'Always double on 11' }
            : { action: 'Hit', reason: 'Hit 11 (Cannot double with 3+ cards)' };
    }

    if (playerTotal === 10 && (dealerVal >= 2 && dealerVal <= 9)) {
        return is2Cards
            ? { action: 'Double', reason: `Double 10 against Dealer ${dealerVal}` }
            : { action: 'Hit', reason: `Hit 10 against Dealer ${dealerVal}` };
    }

    if (playerTotal === 9 && (dealerVal >= 3 && dealerVal <= 6)) {
        return is2Cards
            ? { action: 'Double', reason: `Double 9 against Dealer ${dealerVal}` }
            : { action: 'Hit', reason: `Hit 9 against Dealer ${dealerVal}` };
    }

    // Default aggressive move for low totals
    return { action: 'Hit', reason: `Hard ${playerTotal} hits against Dealer ${dealerVal}` };
}
