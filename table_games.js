// --- Global State & Configuration ---
let game = "table_games", gameTitle = "Table Games Bets Quiz";
let qualified, winner, nextCard = 4; // Tracks game status and the next available card index in the deck
let opponents= [], cardGroupsList = [], handsList= [], resultsList= []; // Raw data containers
let hands = {}, cardGroups = {}, results = {}; // Hydrated class instances stored by ID

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Classes                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Represents a player's hand or a dealer's hand.
 * Handles card storage, value calculation, and deck synchronization.
 */
class Hand {

    constructor({ id = '', title = '', cardGroups = [], cardType = 0, cards = [],
                    updateCardGroup = '', result = function (){}, ignore = null } = {}){

        this.cardGroups = [...cardGroups];
        this.cardType = cardType;
        this.cards = [...cards];
        this.id = id;
        this.ignore = ignore; // Rules for excluding specific cards from the deck
        this.result = result;
        this.title = title;
        this.updateCardGroup = updateCardGroup; // Link to a CardGroup for dynamic updates

        // If cards aren't pre-provided, populate them from the global deck and cardGroupsList
        if(this.cards.length > 0){ return; }

        if(cardGroupsList !== null && deck !== null && cardGroupsList !== undefined && deck !== undefined &&
            Array.isArray(cardGroupsList) && Array.isArray(deck) && cardGroupsList.length>0  && deck.length>0){

            // Logic for manual card selection via 'ignore' object indexes
            if(this.ignore!==null && !("cardGroups" in this.ignore)){
                for(let keep of this.ignore.cardIndexes){
                    this.cards.push(deck[keep]);
                }
            } else {
                // Logic for selecting cards based on defined CardGroups
                for (let cardGrp in this.cardGroups) {
                    for (let group in cardGroupsList) {
                        if (cardGroupsList[group].id === this.cardGroups[cardGrp]) {
                            for (let index in cardGroupsList[group].cardIndexes) {
                                // Add card if it's not specifically excluded in the ignore rules
                                if (!(this.ignore !== null
                                    && this.ignore.cardGroups === cardGroupsList[group].id
                                    && this.ignore.cardIndexes.includes(Number(index)))) {

                                    this.cards.push(deck[cardGroupsList[group].cardIndexes[index]]);
                                }
                            }
                        }
                    }
                }
            }
        }
    } // end constructor

    // --- Computed Getters ---
    get cardsCount(){ return this.cards.length; }
    get hasAce(){ return this.cards.some(c => c.face === 'A'); }
    get hasFaceCard(){ return this.cards.some(c => ['K', 'Q', 'J'].includes(c.face)); }
    get handValues(){ return this.cards.map(card => card.value); }
    get faceValues(){ return this.cards.map(card => card.face); }
    get pointValues(){ return this.cards.map(card => card.points); }

    /** Returns an object mapping card values to their frequency (e.g., { '10': 2 }) */
    get cardFrequencyCount() {
        return this.cards.reduce((acc, card) => {
            acc[card.value] = (acc[card.value] || 0) + 1;
            return acc;
        }, {});
    }

    // --- Sorting ---
    sortLowToHigh() { this.cards.sort((a, b) => a.value - b.value); }
    sortHighToLow() { this.cards.sort((a, b) => b.value - a.value); }

    /** Sorts cards by how often they appear, then by value (useful for Poker hands) */
    sortByFrequencyHighToLow(){
        this.cards.sort((a, b) => {
            const countA = this.cardFrequencyCount[a.value];
            const countB = this.cardFrequencyCount[b.value];
            if (countA !== countB) { return countB - countA; } // Primary: Frequency
            return b.value - a.value; // Secondary: Face Value
        });
    }

    // --- Methods ---

    /** Pulls the next card from the deck and updates the global nextCard counter */
    drawCard() {
        if(deck === null || nextCard === null || deck === undefined || nextCard === undefined ||
            !Array.isArray(deck) || deck.length <= 0 || nextCard < 0){ return; }

        this.cards.push(deck[nextCard]);
        // Also update the logical group index if one is assigned
        if(this.updateCardGroup !== ""){ cardGroups[this.updateCardGroup].cardIndexes.push(nextCard++); }
    }

}

/**
 * Logical container grouping specific deck indexes (e.g., "Dealer's Initial Cards").
 */
class CardGroup {
    constructor({ id = '', name = '', cardIndexes = []}){
        this.id = id;
        this.name = name;
        this.cardIndexes = cardIndexes;
    }
}

/**
 * Defines a betting resolution logic.
 */
class Result {
    constructor({ id = '', title = '', options = [], result = function (){ } }){
        this.id = id;
        this.title = title;
        this.options = options;
        this.result = result;
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Factory Functions (Initializing data from raw lists)                                            //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Standardized helper using global 'handsList' and 'hands'.
 * Converts raw objects into Hand instances.
 * @param {Class|Function} ClassLogic - The class to instantiate, or a function that returns one.
 */
function createHands(ClassLogic) {
    for (let i = 0; i < handsList.length; i++) {
        const HandClass = ClassLogic.prototype ? ClassLogic : ClassLogic(i);
        const hand = new HandClass(handsList[i]);
        hands[hand.id] = hand;
    }
}

/** Converts raw cardGroupsList data into CardGroup instances */
function createCardGroups(){
    for(let group in cardGroupsList) {
        cardGroups[cardGroupsList[group].id] = new CardGroup(cardGroupsList[group]);
    }
}

/** Converts raw resultsList data into Result instances */
function createResults(){
    for(let result in resultsList) {
        results[resultsList[result].id] = new Result(resultsList[result]);
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Common Utility Functions                                                                        //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Retrieves the actual card objects from the deck for a specific named group.
 */
function getCardsArray (cardGroupName){
    let cards = [];
    let deckIndexes = cardGroups[cardGroupName].cardIndexes;
    for (let index in deckIndexes) { cards.push(deck[deckIndexes[index]]); }
    return cards;
}
