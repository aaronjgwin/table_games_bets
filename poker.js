
/////////////////////////////////////////////////////////////////////////////////////////////////////
// Classes                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * PokerHand extends the base Hand class to provide specialized poker logic.
 * It automatically determines the best possible hand from a pool of cards
 * and handles complex rank evaluations (straights, flushes, etc.).
 */
class PokerHand extends Hand {

    constructor(options = {}){
        super(options);

        // If the hand contains more cards than required for the game (e.g., 7 cards in Hold'em),
        // calculate all possible combinations and select the strongest one.
        if (this.cardType !== 0 && this.cardType !== this.cards.length) {

            /**
             * Helper function: Generates all subsets of size k (combinations) from the card pool.
             */
            const getCombinations = (array, k) => { const result = [];
                const combine = (start, currentCombo) => {
                    if (currentCombo.length === k) {
                        result.push( new PokerHand({ cards:[...currentCombo], cardType: this.cardType })); return;
                    }
                    for (let i = start; i < array.length; i++) {
                        currentCombo.push(array[i]); combine(i + 1, currentCombo); currentCombo.pop();
                    }
                };
                combine(0, []); return result;
            };

            let container = getCombinations([...this.cards], this.cardType) ;

            // Iterate through every combination to find the "winner" based on rank logic
            let bestHand = container[0];
            for(let i=1; i<container.length; i++){
                // isWinner is an external function used to compare two hands
                bestHand = isWinner(bestHand, container[i]) === 1 ? bestHand : container[i];
            }
            this.cards = bestHand.cards;
        }

        // Wheel Check: In an A-2-3-4-5 straight, the Ace is treated as a low card (value 1).
        if(this.isWheel){
            const ace = this.cards.find(c => c.face === "A");
            if (ace) { ace.points = 1; ace.value = 1; }
        }

        // Groups multiples together (like pairs/trips) and sorts by value for easier rank checking
        this.sortByFrequencyHighToLow();
    }

    // --- Computed Strength Getters ---

    get is2Pair(){ return this.ofAKind(2).count === 2 }
    get isAA(){ return this.cards.length === 2 && this.cards.every(c => c.face === 'A'); }
    get isAceFace(){ return this.cards.length === 2 && this.hasAce && this.hasFaceCard; }
    get isFullHouse(){ return this.isTrips && this.isPairs; }
    get isFlush(){ return this.isSuited && this.cards.length > 2; }
    get isPairs(){ return this.ofAKind(2).has; }
    get isQuads(){ return this.ofAKind(4).has; }
    get isRoyal(){ return !this.isWheel && this.cards.length > 2 && this.hasAce && this.isStraight; }
    get isSpades(){ return this.isSuited && this.cards[0].suit === "Spades"; }
    get isSuited(){ return this.cards.every(c => c.suit === this.cards[0].suit); }
    get isTrips(){ return this.ofAKind(3).has; }

    /**
     * Determines if the hand contains a consecutive sequence of values.
     * Sorts unique values and checks if the range matches the count.
     */
    get isStraight(){
        if(this.isWheel){ return true; }
        if(this.cards.length <= 2) { return false; }

        const values = [...new Set(this.cards.map(c => c.value))].sort((a, b) => a - b);
        if (values.length !== this.cards.length){ return false; } // Straights cannot have pairs
        return (values[values.length - 1] - values[0]) === (values.length - 1);
    }

    /**
     * Specifically checks for the Ace-to-Five low straight ("The Wheel").
     */
    get isWheel(){
        if (this.cards.length <= 2){ return false; }
        // Generates target array [A, 2, 3...] up to the hand length
        const target = ["A", ...Array.from({ length: this.cards.length - 1 },
            (_, i) => (i + 2).toString())];
        return target.every(val => this.cards.some(c => c.face === val));
    }

    // --- Methods ---

    /**
     * Returns an object indicating if a hand has a specific multiple (e.g. ofAKind(3) for trips).
     * @param {number} number - The size of the group to look for (2 for pair, 3 for trips, etc.)
     */
    ofAKind(number){
        if(!Number.isFinite(number)){ return false; }
        // Group values by how many times they appear
        const grouped = Object.entries(this.cardFrequencyCount).reduce((acc, [val, count]) => {
            if (!acc[count]) acc[count] = [];
            acc[count].push(Number(val));
            return acc;
        }, {});
        if(grouped[number] === undefined){ return { has:false, count: 0}; }
        return { has: Array.isArray(grouped[number]), count: grouped[number].length }
    }

    /**
     * Assigns a hierarchy score to the hand.
     * Lower values represent stronger hands (1 = Royal Flush, 10 = High Card).
     */
    get bestCardPlay(){
        if(this.isRoyal && this.isFlush){    return 1;   } // Royal Flush
        if(this.cards.length === 3 &&
            this.isSuited &&
            this.isTrips){                   return 1.5; } // Three-of-a-Kind Suited
        if(this.isStraight && this.isFlush){ return 2;   } // Straight Flush
        if(this.isQuads){                    return 3;   } // Four-of-a-Kind
        if(this.isFullHouse){                return 4;   } // Full House
        if(this.cards.length === 5 &&
            this.isFlush ||
            this.cards.length === 3 &&
            this.isTrips){                   return 5;   } // (5) Flush | (3) Three-of-a-Kind
        if(this.isStraight){                 return 6;   } // Straight
        if(this.cards.length === 3 &&
            this.isFlush ||
            this.cards.length === 5 &&
            this.isTrips){                   return 7;   } // (5) Three-of-a-Kind | (3) Flush
        if(this.is2Pair){                    return 8;   } // Pairs
        if(this.isAA){                       return 8.7; } // (2) AA
        if(this.isAceFace && this.isSuited){ return 8.8; } // (2) A + Face Card Suited
        if(this.isAceFace){                  return 8.9; } // (2) A + Face Card Unsuited
        if(this.isPairs){                    return 9;   } // Pair
        return 10;    // High Card
    }

}
/**
 * BlackjackHand extends the base Hand class to include scoring
 * and automated strategy logic for the game of 21.
 */
class BlackjackHand extends Hand {

    constructor(options = {}){
        // Links this hand instance to the first associated CardGroup for UI/state updates
        options.updateCardGroup = options.cardGroups[0];
        super(options);
    }

    // --- Computed Getters ---

    /** Counts how many Aces are currently valued at 11 points (Soft Aces) */
    get aceCount(){ return this.cards.filter(card => card.points === 11).length; }

    /** Checks if the initial two cards equal exactly 21 */
    get isBlackjack(){ return this.pointValues.length === 2 && this.score === 21; }

    /** Checks if the total score exceeds 21 */
    get isBusted(){ return this.score > 21; }

    /** Used for dealer 'Insurance' or specific 'peek' logic */
    get isFirstCardAce(){ return this.cards[0].face === "A"; }

    /**
     * Calculates the point total.
     * Automatically converts a Soft Ace (11) to a Hard Ace (1) if the hand busts.
     */
    get score() {
        let score = this.cards.reduce((sum, card) => sum + card.points, 0);
        if (score > 21 && this.aceCount > 0) {
            for(let card of this.cards){
                // Only reduce Ace value if hand has more than 2 cards (prevents BJ logic errors)
                if(card.points === 11 && this.cards.length > 2){
                    card.points = 1;
                    break;
                }
            }
            score = this.cards.reduce((sum, card) => sum + card.points, 0);
        }
        return score;
    }

    // --- Static Utility Methods ---

    /**
     * Standard Casino House Rules:
     * Dealer must hit until they reach 17, and must hit on a "Soft 17" (Ace + 6).
     */
    static drawNextCardDealerRules(dealersHand) {
        if(!dealersHand instanceof BlackjackHand){ return; }
        return (dealersHand.score === 17 && dealersHand.aceCount > 0) || (dealersHand.score < 17);
    }

    /**
     * Implements "Basic Strategy" decision matrix.
     * Returns: 'Split', 'Double', 'Stand', or 'Hit' based on mathematical probability.
     */
    static drawNextCardBasicStrategy(playersHand, dealersUpCardObject) {
        const cards = playersHand.cards;
        const dealerVal = dealersUpCardObject.points;
        const playerTotal = playersHand.score;
        const is2Cards = cards.length === 2;

        // Pair detection (two cards of identical rank)
        const isPair = is2Cards && cards[0].face === cards[1].face;
        const hasAce = playersHand.hasAce;

        // --- 1. PAIRS STRATEGY ---
        if (isPair) {
            const pairFace = cards[0].face;
            let shouldSplit = false;

            // Specific conditions where splitting is optimal
            if (pairFace === '4' && (dealerVal === 5 || dealerVal === 6)) {
                shouldSplit = true;
            } else if (['4', '5', '10', 'J', 'Q', 'K'].includes(pairFace)) {
                shouldSplit = false; // Never split 5s or 10-value cards
            } else if (pairFace === '9' && (dealerVal === 7 || dealerVal >= 10)) {
                shouldSplit = false; // Stand on 9s vs 7, 10, or Ace
            } else if (pairFace === '6' && dealerVal >= 7) {
                shouldSplit = false;
            } else if (['2', '3', '7'].includes(pairFace) && dealerVal >= 8) {
                shouldSplit = false;
            } else {
                shouldSplit = true; // Always split Aces and 8s
            }

            if (shouldSplit) return 'Split';
        }

        // --- 2. SOFT TOTALS (Hands containing an Ace) ---
        if (hasAce && is2Cards) {
            const otherCard = cards.find(c => c.face !== 'A');
            // Treat AA as A+1 if not split
            const otherVal = otherCard ? otherCard.points : 1;

            if (otherVal >= 8) { // A,8 (Soft 19) or A,9 (Soft 20)
                if (otherVal === 8 && dealerVal === 6) return 'Double';
                return 'Stand';
            }
            if (otherVal === 7) { // A,7 (Soft 18)
                if (dealerVal === 7 || dealerVal === 8) return 'Stand';
                if (dealerVal >= 2 && dealerVal <= 6) return 'Double';
                return 'Hit';
            }
            // Aggressive doubling strategy for low soft totals vs weak dealer upcards
            if (otherVal === 6 && (dealerVal >= 3 && dealerVal <= 6)) return 'Double';
            if ((otherVal === 4 || otherVal === 5) && (dealerVal >= 4 && dealerVal <= 6)) return 'Double';
            if ((otherVal === 2 || otherVal === 3) && (dealerVal === 5 || dealerVal === 6)) return 'Double';

            return 'Hit';
        }

        // --- 3. HARD TOTALS ---
        if (playerTotal >= 17) return 'Stand';
        // "Stiff" hands: Stand if dealer is likely to bust (2 through 6)
        if (playerTotal >= 13 && playerTotal <= 16 && (dealerVal >= 2 && dealerVal <= 6)) return 'Stand';
        if (playerTotal === 12 && (dealerVal >= 4 && dealerVal <= 6)) return 'Stand';

        // Double Down opportunities (only if player has exactly 2 cards)
        if (playerTotal === 11) return is2Cards ? 'Double' : 'Hit';
        if (playerTotal === 10 && (dealerVal >= 2 && dealerVal <= 9)) return is2Cards ? 'Double' : 'Hit';
        if (playerTotal === 9 && (dealerVal >= 3 && dealerVal <= 6)) return is2Cards ? 'Double' : 'Hit';

        // Default move
        return 'Hit';
    }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////
// Play Game Functions                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Initializes the game state by building class instances and determining initial outcomes.
 */
function deal(){
    createCardGroups();
    createResults();
    createHands(PokerHand); // Hydrates hands specifically using PokerHand logic

    // Check if the dealer's hand meets the minimum requirements to "play" vs the player
    qualified = doesHandQualify(hands[opponents[1]]);

    // Immediately calculate the winner between the dealer (opponents[1]) and player (opponents[0])
    winner = (function() {
        switch(isWinner(hands[opponents[1]], hands[opponents[0]])) {
            case 1: return hands[opponents[1]].title; // Dealer wins
            case 2: return hands[opponents[0]].title; // Player wins
            case 0: return "Push";                   // Tie
            default: return "Unknown";
        }
    })();
}

/**
 * Orchestrates the automated logic for a Blackjack round using Basic Strategy.
 */
function playBlackjack(playersHand, dealersHand) {
    if(!playersHand instanceof BlackjackHand || !dealersHand instanceof BlackjackHand){ return; }

    let playing = true;
    while (playing){
        // Ask the strategy table for the best move based on dealer's visible card
        let decision = BlackjackHand.drawNextCardBasicStrategy(playersHand, dealersHand.cards[0]);

        switch(decision){
            case 'Hit':
                playersHand.drawCard();
                break;
            case 'Double':
                playersHand.drawCard();
                playing = false; // Turn ends after one card on a double
                rotateCard = true;
                break;
            case 'Split':
                split();
                break;
            case 'Stand':
                playing = false;
                break;
        }
        // End player turn immediately on a Blackjack
        if(playersHand.isBlackjack || dealersHand.isBlackjack){ return; }
    }

    // Dealer turn: If player hasn't busted, dealer draws according to house rules (Soft 17/Hard 16)
    if(!playersHand.isBusted){
        playing = true;
        while (playing){
            if((playing = BlackjackHand.drawNextCardDealerRules(dealersHand))){
                dealersHand.drawCard();
            }
        }
    }
}

/**
 * Handles the logic for splitting a pair into two separate hands.
 * Reconfigures card groups and refreshes data structures.
 */
function split(){
    let bonusHand = hands["bonusHand"];
    let playersHand = hands["playersHand"];

    // Find the current player card configuration to extract the card to be split
    const config = cardGroupsList.find(group => group.id === "player");
    let cardIndex = config.cardIndexes[config.cardIndexes.length-1];
    config.cardIndexes.pop(); // Remove card from first hand

    // Update the visual/logic arrays
    bonusHand.cards.splice(1, 1); bonusHand.drawCard();
    playersHand.cards.pop(); playersHand.drawCard();

    // Create a new card group for the second hand at the start of the list
    cardGroupsList.unshift({ id:"split", name: "Player<br>2nd Hand", cardIndexes: [cardIndex] });

    // Reset and rebuild groups to reflect the new split hand
    cardGroups = {};
    createCardGroups();
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Common Functions                                                                                //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Compares two PokerHands to see which is stronger.
 * @returns {number} 1 if hand1 wins, 2 if hand2 wins, 0 for push.
 */
function isWinner(hand1, hand2){
    if(!hand1 instanceof PokerHand || !hand2 instanceof PokerHand){ return; }

    // If both hands have the same rank (e.g., both are Pairs), compare high cards (kickers)
    if(hand1.bestCardPlay === hand2.bestCardPlay){
        for(let i=0; i<hand1.handValues.length; i++){
            if(hand1.handValues[i]!==hand2.handValues[i]){
                return hand1.handValues[i] > hand2.handValues[i] ? 1 : 2;
            }
        }
        return 0; // Absolute tie
    }
    // Lower score in bestCardPlay represents a higher poker rank
    return hand1.bestCardPlay < hand2.bestCardPlay ? 1 : 2;
}

/**
 * Checks if the dealer's hand meets the specific "Qualification" rules for various poker variants.
 */
function doesHandQualify(hand){
    if(!hand instanceof PokerHand){ return; }

    switch(game){
        case "3CardPoker": // Requires Queen High or better
            return hand.bestCardPlay < 10 || hand.handValues[0] >= 12;
        case "HeadsUpHoldem": // Requires a Pair or better
            return hand.bestCardPlay < 10;
        case "HighCardFlush": // Requires 3-Card 9-High or better
            return hand.cardsCount >=3 && hand.handValues[0] >= 9;
        case "TexasHoldem":
            return true; // Dealer always qualifies
        default:
            console.log("doesHandQualify reached default case, check: " + game);
            return false;
    }
}

/**
 * Converts the numerical bestCardPlay score into a human-readable string.
 * Used for UI labels and feedback.
 */
function getHandCodeDescription(hand, handLength){
    if(!hand instanceof PokerHand || !Number.isFinite(handLength)){ return; }

    let rtn = (function() { switch(hand.bestCardPlay){
        case 1: return "Royal Flush";
        case 1.5: return "Three-of-a-Kind Suited";
        case 2: return "Straight Flush";
        case 3: return "Four-of-a-Kind";
        case 4: return "Full House";
        case 5: return handLength <= 3 ? "Three-of-a-Kind" : "Flush"; // Context-dependent naming
        case 6: return "Straight";
        case 7: return handLength <= 3 ? "Flush" : "Three-of-a-Kind"; // Context-dependent naming
        case 8: return "2 Pairs";
        case 8.7: return "Pair of Aces";
        case 8.8: return "Ace, Face Card Suited";
        case 8.9: return "Ace, Face Card Unsuited";
        case 9: return "Pair";
        case 10: return "High Card";
    }})();
    return rtn+" - "+hand.faceValues.toString();
}


