/*
/////////////////////////////////////////////////////////////////////////////////////////////////////
//  Creates a 52 Card Deck                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////
Deck is Array of Card Objects
var deck = { Card }

Card object example:
 { suit:"Spades", color:"Black", icon:"♠", face:"A", points:11, value:14 }

*/

// Global trackers for cards specified via URL (matched) and the rest of the deck (remaining)
const matched = []; remaining = [];

{
// Define the four standard suits and their metadata
    const suits = [
        { suit:"Spades",   color:"Black", icon:"&spades;", short:"s" },
        { suit:"Clubs",    color:"Black", icon:"&clubs;", short:"c" },
        { suit:"Hearts",   color:"Red",   icon:"&hearts;", short:"h" },
        { suit:"Diamonds", color:"Red",   icon:"&diams;", short:"d" }
    ];

// Define high cards and their point/sort values
    const facesAce = [
        { face:"J", points:10, value:11 },
        { face:"Q", points:10, value:12 },
        { face:"K", points:10, value:13 },
        { face:"A", points:11, value:14 }
    ];

// Generate cards 2 through 10 dynamically
    const numbered = Array(9).fill(null).map((_, i) => {
        const n = i + 2;
        return { face: n.toString(), points: Number(n), value: Number(n) };
    });

    // Build the master deck by combining every suit with every rank
    var deck = suits.flatMap(suit =>
        [...numbered, ...facesAce].map(unsuited => ({ ...suit, ...unsuited }))
    );

    remaining = [...deck];

    // Add extra decks if playing Blackjack (3 decks total)
    if(getUrlVar("game") === "Blackjack"){ remaining.push(...deck, ...deck); }

    // Retrieve specific cards from URL (e.g., ?set=As,10h) to force a specific hand
    const setParam = getUrlVar("set");
    const cardArray = setParam ? setParam.split(",") : [];


    // --- PARSE USER CARDS ---
    // Clean and split strings like "10s" into { rank: "10", suit: "s" }
    const parsedCards = cardArray.map(card => { card=card.replace(/(\s|%20)+/g, "");
        const suit = card.slice(-1).toLowerCase();     // c,d,h,s
        const rank = card.slice(0, -1).toUpperCase();  // A,K,Q,J,10-2
        return { rank, suit };
    });

    // Extract specific cards from the deck so they appear first (not shuffled)
    parsedCards.forEach(({ rank, suit }) => {
        const index = remaining.findIndex( c => c.face === rank && c.short === suit );
        if (index !== -1) { matched.push(remaining.splice(index, 1)[0]); }
    });

    // Reassemble the deck: matched cards are on top, followed by the rest
    deck = [...matched, ...remaining];

}

/**
 * Shuffles only the cards that weren't "matched" via URL parameters
 * then reattaches them to the bottom of the forced cards.
 */
function shuffleDeck() {
    shuffle(remaining);
    deck = [...matched, ...remaining];
}

/**
 * Standard Fisher-Yates shuffle algorithm to randomize an array in place.
 */
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap elements
    }
}

/**
 * Helper to extract query parameters from the browser address bar.
 */
function getUrlVar(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}
