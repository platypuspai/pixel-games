# Lucky Guy Chrome Extension

A Chrome extension version of the Lucky Guy spinning wheel game.

## Features

- 🎡 Spin the wheel and guess the winning number
- 📊 Progressive levels that get harder
- 💾 Save your progress locally
- 🌐 Global leaderboard via Firebase
- 🎨 Pixel-art retro style

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the `extension` folder
6. The extension will appear in your Chrome toolbar

## How to Play

1. Enter your player name
2. Click **START GAME**
3. Pick a number between 1 and the current level
4. Click **SPIN THE WHEEL**
5. If you guess correctly, advance to the next level!
6. Your progress is automatically saved

## Storage

- **Local Storage**: Saves your name and current level in Chrome's local storage
- **Firebase**: Uploads your best score to a global leaderboard

## Firebase Configuration

The extension uses the same Firebase database as the web version, so your scores sync across both platforms.

## License

Same as the pixel-games repository
