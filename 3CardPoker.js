// --- Game Configuration ---
game = "3CardPoker";
gameTitle = "Three Card Poker";
opponents = ["playersHand", "dealersHand"];

/**
 * cardGroupsList: Defines visual/logical card buckets.
 * dealer: Dealer's 3 cards (indexes 3-5).
 * progressives: Extra cards used for 5-card progressive bets.
 * player: Player's 3 cards (indexes 0-2).
 */
cardGroupsList = [
  { id:"dealer", name: "Dealer", cardIndexes: [3,4,5] },
  { id:"progressives", name: "Progressives", cardIndexes: [6,7] },
  { id:"player", name: "Player", cardIndexes: [0,1,2] }
];

/**
 * handsList: Hand definitions for scoring.
 * dealersHand/playersHand: Standard 3-card evaluation.
 * bestSixCardHand: Combines player and dealer cards to find best 5-card poker hand.
 * fiveCardHand: Combines player and progressive cards for the "Red" side bet.
 */
handsList = [
  { id: "dealersHand", title: "Dealer", cardType: 3, cardGroups: ["dealer"],
    result: function (){ return getHandCodeDescription( hands["dealersHand"], 3); } },
  { id: "playersHand", title: "Player", cardType: 3, cardGroups: ["player"],
    result: function (){ return getHandCodeDescription(hands["playersHand"], 3); } },
  { id: "bestSixCardHand", title: "6-Card", cardType: 5, cardGroups: ["player", "dealer"],
    result: function (){ return getHandCodeDescription(hands["bestSixCardHand"], 5); } },
  { id: "fiveCardHand", title: "Prog (red)", cardType: 5, cardGroups: ["player", "progressives"],
    result: function (){ return getHandCodeDescription(hands["fiveCardHand"], 5); } }
];

/**
 * resultsList: Quiz questions for the user interface.
 * Tracks qualification, game outcome, and various side bet payouts.
 */
resultsList = [
  { id: "qualify", title: "Dealer Qualified", options: [...arrayYesNo], result: function (){
      return qualified ? "Yes" : "No" } },
  { id: "winner", title: "Winner", options: ["Player", "Dealer", "Push"], result: function (){
      return winner; } },
  { id: "ante", title: "Ante", options: [...arrayWinLosePush], result: function (){
      return betPayout(winner, true); } },
  { id: "play", title: "Play", options: [...arrayWinLosePush], result: function (){
      return betPayout(winner, qualified); } },
  { id: "bonus", title: "Ante Bonus", options: [...arrayWinLose], result: function (){
      return antieBonus(hands["playersHand"].bestCardPlay); } },
  { id: "pair", title: "Pair Plus", options: [...arrayWinLose], result: function (){
      return pairPlus(hands["playersHand"].bestCardPlay); } },
  { id: "six", title: "6 Card", options: [...arrayWinLose], result: function (){
      return sixCard(hands["bestSixCardHand"].bestCardPlay); } },
  { id: "red", title: "Red (Pgr)", options: [...arrayWinLose], result: function (){
      return proRed(hands["fiveCardHand"].bestCardPlay); } },
  { id: "blue", title: "Blue (Pgr)", options: [...arrayWinLose], result: function (){
      return proBlue(hands["playersHand"].bestCardPlay, hands["playersHand"].isSpades); } }
];

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Payout Verbiage & Rules                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Main bet payout logic.
 * Note: If Dealer doesn't qualify (Queen high or better), the 'Play' bet is a Push.
 */
function betPayout(winner, qualified){
  switch (winner){
    case "Push": return "Push";
    case "Dealer": return "Lose";
    case "Player": return qualified ? "Win - 1-1" : "Push";
  }
}

/** Extra payout for high-ranking hands on the Ante bet */
function antieBonus(bestCardPlay){
  switch(bestCardPlay){
    case 1: case 2: return "Win - Straight Flush 5:1";
    case 5: return "Win - Three-of-a-Kind 4:1";
    case 6: return "Win - Straight 1:1";
    default: return "Lose";
  }
}

/** Standard Pair Plus side bet evaluation */
function pairPlus(bestCardPlay){
  switch(bestCardPlay){
    case 1: case 2: return "Win - Straight Flush 40:1";
    case 5: return "Win - Three-of-a-Kind 30:1";
    case 6: return "Win - Straight 6:1";
    case 7: return "Win - Flush 3:1";
    case 9: return "Win - Pair 1:1";
    default: return "Lose";
  }
}

/** 3-Card Progressive (Blue) - Includes Spade-specific Jackpot logic */
function proBlue(bestCardPlay, isSpades){
  switch(bestCardPlay){
    case 1: return isSpades ? "Win - Mini Royal Spades 100% 3CJkpt" : "Win - Mini Royal Other 500:1";
    case 2: return "Win - Straight Flush 100:1";
    case 5: return "Win - Three-of-a-Kind 90:1";
    default: return "Lose";
  }
}

/** 5-Card Progressive (Red) - Evaluates the player's 3 cards plus 2 progressive cards */
function proRed(bestCardPlay){
  switch(bestCardPlay){
    case 1: return "Win - Royal Flush 100% Mega";
    case 2: return "Win - Straight Flush 100% Major";
    case 3: return "Win - Four-of-a-Kind 100% Minor";
    case 4: return "Win - Full House 50:1";
    case 5: return "Win - Flush 40:1";
    case 6: return "Win - Straight 30:1";
    case 7: return "Win - Three-of-a-Kind 3:1";
    default: return "Lose";
  }
}

/** 6-Card Bonus - Best 5-card hand using all cards from Player and Dealer */
function sixCard(bestCardPlay){
  switch(bestCardPlay){
    case 1: return "Win - Royal Flush 1000:1";
    case 2: return "Win - Straight Flush 200:1";
    case 3: return "Win - Four-of-a-Kind 50:1";
    case 4: return "Win - Full House 25:1";
    case 5: return "Win - Flush 15:1";
    case 6: return "Win - Straight 10:1";
    case 7: return "Win - Three-of-a-Kind 5:1";
    default: return "Lose";
  }
}
