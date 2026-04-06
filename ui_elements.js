// --- Constants for UI Dropdowns ---
const arrayYesNo = ["Yes", "No"];
const arrayWinLose = ["Win", "Lose"];
const arrayWinLosePush = [...arrayWinLose, "Push"];
let rotateCard = false; // Trigger for specific Blackjack/Baccarat layout changes

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Build UI Elements                                                                               //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Generates the HTML Table for a group of cards.
 * Handles specialized layouts for Baccarat (rotated cards) and Blackjack.
 */
function createCardGroupsHtml(cardGroup){
    if(!cardGroup instanceof CardGroup){ return; }

    // Determine if cards should be displayed horizontally/rotated (common in Baccarat)
    let rotateCardLogic = typeVar === "baccarat" ||
        gameVar === "Blackjack" && cardGroup.id === "player" && rotateCard;

    let table = document.createElement("table");
    table.classList.add("cards");

    // Add group label (e.g., "Player Hand", "Dealer Hand")
    let caption = document.createElement("caption");
    caption.innerHTML = cardGroup.name;
    table.appendChild(caption);

    let tr = document.createElement("tr");
    if(rotateCardLogic){ tr.classList.add("rotateCard"); }
    table.appendChild(tr);

    for (let cardIndex in cardGroup.cardIndexes){
        let indexOfCardInDeck = cardGroup.cardIndexes[cardIndex];
        let td = document.createElement("td");

        // Apply color (Red/Black) and ordinal classes (FirstCard, SecondCard, etc.)
        td.classList.add( deck[indexOfCardInDeck].color, (toOrdinalWord(Number(cardIndex)+1) + "Card"));
        td.innerHTML = "<span><data class='face'>" +deck[indexOfCardInDeck].face +
            "</data>" + deck[indexOfCardInDeck].icon + "</span>";
        td.setAttribute("data-value", deck[indexOfCardInDeck].face);

        // Baccarat/Rotated layout logic: Adjusts rowspans to fit the horizontal 3rd card
        if(rotateCardLogic && Number(cardIndex) !== 2) { td.rowSpan = 2; }

        // Baccarat specific: The player's 3rd card visually prepends to the row
        if(typeVar === "baccarat" && Number(cardIndex) === 2 && cardGroup.id === "player"){
            tr.prepend(td);
        } else {
            tr.appendChild(td);
        }

        // Creates a spacer row to support the rotated card alignment
        if(rotateCardLogic && Number(cardIndex) === 2){
            let trSpacer = document.createElement("tr");
            table.appendChild(trSpacer);

            let td = document.createElement("td");
            td.classList.add( "spacer" );
            trSpacer.appendChild(td);
        }
    }
    return table;
}

/**
 * Creates a row for the quiz results table, including a dropdown for user input
 * and a hidden/visible correct answer span.
 */
function createResultsTableRowHtml (result){
    if(!result instanceof Result){ return; }

    let rowTitle = String(result.title).trim();
    let tr = document.createElement("tr");

    // Column 1: The Question/Title
    let th = document.createElement("th");
    th.textContent = rowTitle;
    th.classList.add("column1");
    tr.appendChild(th);

    // Column 2: The User Selection Dropdown
    let td1 = document.createElement("td");
    td1.classList.add("column2");
    tr.appendChild(td1);

    let select = document.createElement("select");
    let nameId = "ddl" + toTitleCase(result.id);
    select.setAttribute("id", nameId );
    select.setAttribute("name", nameId );
    td1.appendChild(select);

    // Default "Select" option
    let optDefault = document.createElement("option");
    optDefault.textContent = "-- Select result --";
    optDefault.setAttribute("value", "" );
    optDefault.selected = true;
    optDefault.disabled = true;
    select.appendChild(optDefault);

    // Populate dropdown with predefined arrays (Yes/No, Win/Lose, etc.)
    for(let key in result.options){
        let option = result.options[key];
        let opt = document.createElement("option");
        opt.textContent = option;
        opt.setAttribute("value", option );
        select.appendChild(opt);
    }

    // Column 3: The hidden "Correct Answer"
    let td2 = document.createElement("td");
    td2.classList.add("column3");
    tr.appendChild(td2);

    let span = document.createElement("span");
    span.textContent = result.result(); // Executes result logic function
    span.classList.add("answer");
    td2.appendChild(span);

    return tr;
}

/**
 * Creates a simple display div for a Hand's final description/outcome.
 */
function createHandResultsHtml(hand){
    if(!hand instanceof Hand){ return; }

    let div = document.createElement("div");
    div.className = "answer";

    let label = document.createElement("label");
    label.textContent = hand.title + ":";
    div.appendChild(label);

    let span = document.createElement("span");
    span.innerHTML = hand.result();
    div.appendChild(span);

    return div;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Common String & Math Functions                                                                  //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/** Converts "HELLO WORLD" to "Hello World" */
function toTitleCase(str) {
    return str.toLowerCase().split(' ').map(function(word) {
        return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
}

/**
 * Converts a number like 1 to "first", 22 to "twenty-second", etc.
 * Useful for dynamic class names like "firstCard", "secondCard".
 */
function toOrdinalWord(num) {
    if(!Number.isFinite(num)) { return; } num = Number(num);

    const ordinals = [
        "zeroth", "first", "second", "third", "fourth", "fifth",
        "sixth", "seventh", "eighth", "ninth", "tenth",
        "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth",
        "sixteenth", "seventeenth", "eighteenth", "nineteenth"
    ];

    const tens = [
        "", "", "twentieth", "thirtieth", "fortieth", "fiftieth",
        "sixtieth", "seventieth", "eightieth", "ninetieth"
    ];

    const tensPrefix = [
        "", "", "twenty", "thirty", "forty", "fifty",
        "sixty", "seventy", "eighty", "ninety"
    ];

    if (num < 20) return ordinals[num];

    if (num < 100) {
        const tenIndex = Math.floor(num / 10);
        const remainder = num % 10;
        if (remainder === 0) return tens[tenIndex];
        return `${tensPrefix[tenIndex]}-${ordinals[remainder]}`;
    }

    if (num < 1000) {
        const hundredIndex = Math.floor(num / 100);
        const remainder = num % 100;
        const hundredPart = `${toCardinalWord(hundredIndex)} hundred`;
        if (remainder === 0) return `${hundredPart}th`;
        return `${hundredPart} and ${toOrdinalWord(remainder)}`;
    }

    return "Number too large";
}

/** Helper for large numbers, converts index 1 to "one", 2 to "two", etc. */
function toCardinalWord(num) {
    const cardinals = [
        "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"
    ];
    return cardinals[num];
}


/////////////////////////////////////////////////////////////////////////////////////////////////////
// URL Config & Functions                                                                          //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Mapping of short codes to full labels for different hand participants.
 * Used to label the card selection tables in the URL builder.
 */
let urlGroupNames = [
    { s:"Bkr", l:"Banker" },
    { s:"Cty", l:"Cmty" },
    { s:"Dlr", l:"Dealer" },
    { s:"Dk",  l:"Deck" },
    { s:"Ply", l:"Player" },
    { s:"P1",  l:"Player1" },
    { s:"P2",  l:"Player2" },
    { s:"Prg", l:"Progr" }
];

/**
 * Configuration mapping for different games.
 * The numbers correspond to indices in urlGroupNames to define which
 * participants need card inputs for a specific game type.
 */
let urlGroupConfig = {
    Blackjack:[4,2,4,2,3,3,3,3,3],
    MiniBac:[4,0,4,0,3,3],
    EzBac:[4,0,4,0,3,3],
    EternalBac:[4,0,4,0,3,3],
    TexasHoldem:[1,1,1,1,1,5,5,6,6],
    HeadsUpHoldem:[1,1,1,1,1,4,4,2,2],
    ThreeCardPoker:[4,4,4,2,2,2,7,7],
    HighCardFlush:[4,4,4,4,4,4,4,2,2,2,2,2,2,2]
};

/**
 * Dynamically builds a set of HTML tables allowing a user to "build" a custom deck.
 * Each table represents a participant (Dealer, Player, etc.) defined by the gameConfig.
 * @param {Array} gameConfig - An array of indices from urlGroupNames.
 */
function urlBuilder(gameConfig) {
    let setCardsBuilder = document.getElementById("setCardsBuilder");
    for(let i = 0; i<gameConfig.length; i++){
        let table = document.createElement("table");
        table.setAttribute("style", "display: inline;");

        // Set the caption based on the participant label (e.g., "#1 Banker")
        let caption = document.createElement("caption");
        caption.innerHTML = "#" + (i+1) + " " + urlGroupNames[gameConfig[i]].l;
        table.appendChild(caption);

        let tr = document.createElement("tr");
        table.appendChild(tr);

        let td = document.createElement("td");

        // Generate unique IDs for the value and suit dropdowns
        let nameId = "select" + (i+1);
        td.appendChild(createCardValueSelect(nameId));
        td.appendChild(createCardSuitSelect(nameId));
        tr.appendChild(td);

        setCardsBuilder.appendChild(table);
    }

}

/**
 * Creates a dropdown specifically for card suits (Spades, Clubs, Hearts, Diamonds).
 */
function createCardSuitSelect(nameId){
    let suits = ["&spades;","&clubs;","&hearts;","&diams;"];
    // Values map to short codes used by the deck parser (s, c, h, d)
    return createSelect(nameId+"_suit", suits, ["s","c","h","d"]);
}

/**
 * Creates a dropdown specifically for card face values (A, K, Q, etc.).
 */
function createCardValueSelect(nameId){
    let cardValues = ["A","K","Q","J","10","9","8","7","6","5","4","3","2"];
    return createSelect(nameId+"_value", cardValues, cardValues);
}

/**
 * Generic helper to create a <select> element with options.
 * @param {string} nameId - The ID and Name attribute for the element.
 * @param {Array} options - The text to display to the user.
 * @param {Array} values - The actual data values for the options.
 */
function createSelect(nameId, options, values){

    let select = document.createElement("select");
    select.setAttribute("id", nameId );
    select.setAttribute("name", nameId );

    // Default placeholder option
    let optDefault = document.createElement("option");
    optDefault.textContent = "-";
    optDefault.setAttribute("value", "" );
    optDefault.selected = true;
    optDefault.disabled = true;
    select.appendChild(optDefault);

    // Loop through arrays to build out the option list
    for(let key in options){
        let opt = document.createElement("option");
        opt.innerHTML = options[key];
        opt.setAttribute("value", values[key]);
        select.appendChild(opt);
    }

    return select;
}
