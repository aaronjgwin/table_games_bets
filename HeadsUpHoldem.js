// --- Game Configuration ---
game = "HeadsUpHoldem";
gameTitle = "Heads Up Hold\'em";
opponents = ["playersHand", "dealersHand"];

/**
 * cardGroupsList: Defines the layout of cards on the table.
 * player: 2 hole cards (indexes 5, 6).
 * community: The 5 board cards shared by all (indexes 0-4).
 * dealer: 2 hole cards (indexes 7, 8).
 */
cardGroupsList = [
  { id:"player", name: "Player", cardIndexes: [5,6] },
  { id:"community", name: "Community Board", cardIndexes: [0,1,2,3,4] },
  { id:"dealer", name: "Dealer", cardIndexes: [7,8] }
];

/**
 * handsList: Poker hand definitions.
 * dealersHand/playersHand: Use the best 5-card combination of hole cards + board.
 * pocketHand: Evaluates only the player's 2 hole cards for a specific bonus.
 * progressiveHand: Uses hole cards + only the first 3 community cards (Flop).
 */
handsList = [
  { id: "dealersHand", title: "Dealer", cardType: 5, cardGroups: ["dealer","community"],
    result: function (){ return getHandCodeDescription( hands["dealersHand"], 5); } },
  { id: "playersHand", title: "Player", cardType: 5, cardGroups: ["player","community"],
    result: function (){ return getHandCodeDescription(hands["playersHand"], 5); } },
  { id: "pocketHand", title: "Pocket Bonus", cardType: 2, cardGroups: ["player"],
    result: function (){ return getHandCodeDescription(hands["pocketHand"], 2); } },
  { id: "progressiveHand", title: "Progressives", cardType: 5, cardGroups: ["player", "community"],
    ignore: { cardGroups: "community", cardIndexes:[3,4] }, // Excludes Turn and River
    result: function (){ return getHandCodeDescription(hands["progressiveHand"], 5); } }
];

/**
 * resultsList: Quiz questions and answer logic for the user interface.
 * Tracks dealer qualification (Pair or better), game outcome, and specific side bets.
 */
resultsList = [
  { id: "qualify", title: "Dealer Qualified", options: [...arrayYesNo], result: function (){
      return qualified ? "Yes" : "No" } },
  { id: "winner", title: "Winner", options: ["Player", "Dealer", "Push"], result: function (){
      return winner; } },
  { id: "ante", title: "Ante", options: [...arrayWinLosePush], result: function (){
      return betPayout(winner, qualified); } },
  { id: "play", title: "Play", options: [...arrayWinLosePush], result: function (){
      return betPayout(winner, true); } },
  { id: "odds", title: "Odds", options: [...arrayWinLose], result: function (){
      return odds(hands["playersHand"].bestCardPlay); } },
  { id: "badBeat", title: "Bad Beat", options: [...arrayWinLose], result: function (){
      return badBeat(hands["playersHand"].bestCardPlay, winner); } },
  { id: "tripsPlus", title: "Trips Plus", options: [...arrayWinLose], result: function (){
      return tripsPlus(hands["playersHand"].bestCardPlay); } },
  { id: "pocketBonus", title: "Pocket Bonus", options: [...arrayWinLose], result: function (){
      return pocketBonus(hands["pocketHand"].bestCardPlay); } },
  { id: "red", title: "Red (Pgr)", options: [...arrayWinLose], result: function (){
      return proRed(hands["progressiveHand"].bestCardPlay); } },
  { id: "blue", title: "Blue (Pgr)", options: [...arrayWinLose], result: function (){
      return proBlue(hands["progressiveHand"].bestCardPlay); } }
];

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Payout Verbiage & Logic                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Standard bet payout logic.
 * If Dealer doesn't qualify, Ante pushes even if player has the better hand.
 */
function betPayout(winner, qualified){
  switch (winner){
    case "Push": return "Push";
    case "Dealer": return "Lose";
    case "Player": return qualified ? "Win - 1:1" : "Push";
  }
}

/** Odds payout for the player's final 5-card rank */
function odds(bestCardPlay){
  switch(bestCardPlay){
    case 1: return "Win - Royal Flush 500:1";
    case 2: return "Win - Straight Flush 50:1";
    case 3: return "Win - Four-of-a-Kind 10:1";
    case 4: return "Win - Full House 3:1";
    case 5: return "Win - Flush 1.5:1";
    case 6: return "Win - Straight 1:1";
    default: return "Lose";
  }
}

/** Payout for "Bad Beat" scenarios where the player loses with a strong hand (Straight or better) */
function badBeat(bestCardPlay, winner){
  if(winner!=="Dealer"){bestCardPlay = 7;} // Only applies if dealer wins
  switch(bestCardPlay){
    case 2: return "Win - Straight Flush 500:1";
    case 3: return "Win - Four-of-a-Kind 50:1";
    case 4: return "Win - Full House 10:1";
    case 5: return "Win - Flush 8:1";
    case 6: return "Win - Straight 5:1";
    case 1: default: return "Lose";
  }
}

/** Standard Trips Plus side bet evaluation (Three-of-a-Kind or better) */
function tripsPlus(bestCardPlay){
  switch(bestCardPlay){
    case 1: return "Win - Royal Flush 100:1";
    case 2: return "Win - Straight Flush 40:1";
    case 3: return "Win - Four-of-a-Kind 30:1";
    case 4: return "Win - Full House 8;1";
    case 5: return "Win - Flush 7:1";
    case 6: return "Win - Straight 4:1";
    case 7: return "Win - Three-of-a-Kind 3:1";
    default: return "Lose";
  }
}

/** $1 Progressive (Blue) Payouts */
function proBlue(bestCardPlay){
  switch(bestCardPlay){
    case 1: return "Win - Royal Flush 100% $1Jkpt";
    case 2: return "Win - Straight Flush 10% $5Jkpt";
    case 3: return "Win - Four-of-a-Kind $300";
    case 4: return "Win - Full House $50";
    case 5: return "Win - Flush $40";
    case 6: return "Win - Straight $30";
    case 7: return "Win - Three-of-a-Kind $9";
    default: return "Lose";
  }
}

/** $5 Progressive (Red) Payouts */
function proRed(bestCardPlay){
  switch(bestCardPlay){
    case 1: return "Win - Royal Flush 100% $5Jkpt";
    case 2: return "Win - Straight Flush 10% $5Jkpt";
    case 3: return "Win - Four-of-a-Kind $1,500";
    case 4: return "Win - Full House $250";
    case 5: return "Win - Flush $200";
    case 6: return "Win - Straight $150";
    case 7: return "Win - Three-of-a-Kind $45";
    default: return "Lose";
  }
}

/** Evaluates the player's 2 hole cards for a pocket bonus (Aces, Ace-Face, or Pairs) */
function pocketBonus(bestCardPlay){
  switch(bestCardPlay){
    case 8.7: return "Win - Pair of Aces 25:1";
    case 8.8: return "Win - Ace, Face Suited 20:1";
    case 8.9: return "Win - Ace, Face Unsuited 10:1";
    case 9:   return "Win - Pairs 5:1";
    default:  return "Lose";
  }
}
