# Table Games Bets: Dealer & Surveillance Training Tool

A web-based training platform designed to test and refine the speed and accuracy of **bet payout calculations**. This tool is built specifically for **casino dealers** and **surveillance officers** to ensure mastery of floor operations through interactive drills.

## 🔗 Live Demo
Access the training tool directly in your browser:
**[ajgwin.com/table_games_bets](http://ajgwin.com/table_games_bets)**

## 🚀 Features

*   **Training Simulations**: Real-world scenarios to test user knowledge of complex bet payouts and game flow.
*   **Expert Game Logic**: Built-in engine utilizing **Basic Strategy** and industry-standard best practices to ensure training matches professional casino floor expectations.
*   **Flexible Card Dealing**: 
    *   **Random Mode**: Let the system generate random hands to test adaptability.
    *   **Manual Mode**: Set specific cards to drill difficult or "edge-case" scenarios.
*   **Zero Installation**: Runs directly in any modern web browser using standard web technologies.

## 🛠️ Tech Stack

*   **HTML5**: Semantic structure for the training interface.
*   **CSS3**: Responsive styling for use on tablets or desktop monitors.
*   **JavaScript (ES6+)**: Core logic for payout calculations, Basic Strategy, and card randomization.

## 📖 How to Use

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com
    ```
2.  **Open the Tool**: Locate the `index.html` file in the project folder and open it in your preferred web browser.
3.  **Choose Your Drill**:
    *   Select a game to begin testing.
    *   Choose between **Random** shuffle or **Manual** card entry to set up a specific scenario.
4.  **Verify Payouts**: Input the correct payout and receive immediate feedback based on optimized game logic.

## 🏗️ Technical Architecture

The application is built on a modular, object-oriented JavaScript framework designed to separate game rules from the user interface.

### Core Class Structure
*   **`deck.js`**: Managed by the `Deck` class. It handles the generation of standard 52-card sets and shuffling algorithms.
*   **`table_games.js`**: The base engine and acts as an orchestrator. It holds the global config and base code for the hand, cardGroup, & result classes.
*   **`ui_elements.js`**: Decouples the logic from the DOM.

### Hand Evaluation Logic
The engine uses specialized evaluators to process game-specific win conditions:

*   **Baccarat (Modulo 10)**: Uses a sum-and-strip method where card totals are calculated, and only the last digit is retained (e.g., a $15$ becomes a $5$). It includes the "Third Card Rule" logic to determine if the Player or Banker hits based on natural totals.
*   **Poker (Heuristic Ranking)**: Implements a hierarchical evaluation system. It sorts cards by rank to identify Straights and Flushes, while using a "Kicker" system to break ties between identical pairs or high cards.
*   **Specialty Configs**: 
    *   **3CardPoker**: Adjusts traditional rankings (where a Straight beats a Flush).
    *   **HighCardFlush**: Evaluates hands based on suit quantity rather than rank sequence.
    *   **Blackjack**: Features dynamic "Soft/Hard" Ace evaluation to prevent busting while maximizing hand strength.

### Configuration Modules
The system is highly extensible through configuration files like `EzBac.js`, `TexasHoldem.js`, and `HeadsUpHoldem.js`. These files inject specific payout odds and side-bet rules (like Dragon 7 or Panda 8) into the core engine without modifying the base classes.

## 🤝 Contributing

We welcome updates that improve training efficiency. Please submit a Pull Request for:
*   New payout variations (e.g., Side bets like 21+3).
*   Enhanced Basic Strategy logic or UI improvements.
*   New game modules for the training suite.

## 📜 License

This project is licensed under the [MIT License](LICENSE).
