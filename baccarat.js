// Toggle for persistent betting logic between rounds
let eternalBets = false;

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Classes                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Baccarat class extends Hand to implement "Punto Banco" scoring.
 * Scores are calculated using modulo 10 (e.g., a total of 15 counts as 5).
 */
class Baccarat extends Hand {

    constructor(options = {}) {
        super(options);
        // Initial score based only on the first two cards dealt
        this.twoCardCount = (this.pointValues[0] + this.pointValues[1]) % 10;
    }

    /** Calculates current hand total using the Baccarat "Modulo 10" rule */
    get count(){
        let count = 0;
        for(let valIndex in this.pointValues){ count += this.pointValues[valIndex]; }
        return count % 10;
    }

    // --- State Helpers ---
    /** Returns the point value of the 3rd card if drawn, otherwise null */
    get get3rdCardOrNull(){ return this.cards.length === 3 ? this.cards[2].points : null; }
    get has3rdCard(){ return this.cards.length === 3; }
    get is2Card7(){ return this.cards.length === 2 && this.count === 7; }
    get is3Card7(){ return this.cards.length === 3 && this.count === 7; }
    get is3Card8(){ return this.cards.length === 3 && this.count === 8; }
    get is3Card9(){ return this.cards.length === 3 && this.count === 9; }

    /** A "Natural" is an 8 or 9 on the first two cards; it ends the round immediately */
    get isNatural(){ return this.count >= 8 && this.cards.length === 2; }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Play Game Functions                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Initializes the Baccarat round and determines the winner.
 */
function deal(){
    createCardGroups();
    createResults();
    createHands(Baccarat); // Instantiates hands as Baccarat objects
    playBaccarat();        // Executes drawing rules

    // Determine the winning outcome for the UI
    winner = (function() {
        let hand1 = hands["bankersHand"], hand2 = hands["playersHand"];
        if(!hand1 instanceof Baccarat || !hand2 instanceof Baccarat){ return; }

        if(hand1.count === hand2.count){
            return hands["bankersHand"].isNatural ? "Natural Tie" : "Tie";
        }
        // In Baccarat, the higher score wins (closer to 9)
        return hand1.count < hand2.count ? "Player" : "Banker";
    })();
}

/**
 * Implements the "Tableau" (fixed rules for drawing a third card).
 */
function playBaccarat(){
    if(hands===null||hands.length<=0){ return; }

    // If either side has a "Natural" (8 or 9), no more cards are drawn
    if(!hands["playersHand"].isNatural && !hands["bankersHand"].isNatural){

        // Player draws if they have 0-5; stands on 6-7
        if(draw3rdCardPlayerRules(hands["playersHand"].count)){
            hands["playersHand"].drawCard();
        }

        if (hands["playersHand"].has3rdCard) {
            // If player drew a card, Banker follows a complex matrix based on that card
            if (draw3rdCardBankerRules(hands["bankersHand"].count, hands["playersHand"].get3rdCardOrNull)) {
                hands["bankersHand"].drawCard();
            }
        } else {
            // If player stood, Banker simply follows Player rules (draw on 0-5)
            if (draw3rdCardPlayerRules(hands["bankersHand"].count)) {
                hands["bankersHand"].drawCard();
            }
        }
    }
}

/**
 * Standard rule: Stand on 6 or 7, draw on 0 through 5.
 */
function draw3rdCardPlayerRules(count){
    return Number(count)<=5;
}

/**
 * Banker's 3rd card decision matrix.
 * Based on Banker's current total AND the specific value of the Player's 3rd card.
 */
function draw3rdCardBankerRules(count, player3rdCard){
    if(!Number.isFinite(count) || !Number.isFinite(player3rdCard)){ return; }

    return (count <= 2) || // Always draw on 0, 1, 2
        (count === 3 && player3rdCard !== 8) || // Draw on 3 unless Player 3rd card was an 8
        (count === 4 && player3rdCard >= 2 && player3rdCard <= 7) || // Draw on 4 if Player drew 2-7
        (count === 5 && player3rdCard >= 4 && player3rdCard <= 7) || // Draw on 5 if Player drew 4-7
        (count === 6 && player3rdCard >= 6 && player3rdCard <= 7);   // Draw on 6 if Player drew 6-7
}
