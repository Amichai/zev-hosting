# Yakawow Score API Documentation

## Overview

The Yakawow Score API allows games to save player scores to the cloud automatically. Scores are tied to authenticated users and displayed on the High Scores leaderboard.

## Quick Start

Add this single line of code to submit a score:

```javascript
await window.parent.saveGameScore(yourScore);
```

That's it! The platform handles everything else automatically.

## How It Works

1. **User plays your game** - The game runs in an iframe within the Yakawow platform
2. **Game submits score** - Your game calls `window.parent.saveGameScore(score)`
3. **Platform saves it** - The score is automatically linked to:
   - The logged-in username
   - Your game's title
   - The current timestamp
4. **Appears on leaderboard** - Players can view scores in the High Scores tab

## API Functions

### 1. Save Score (Required)

```javascript
await window.parent.saveGameScore(scoreValue);
```

**Parameters:**
- `scoreValue` (number) - The player's score

**Example:**
```javascript
async function endGame() {
    const finalScore = 1500;
    await window.parent.saveGameScore(finalScore);
}
```

**Best Practices:**
- Call this when the game ends
- Use `await` to ensure the score is saved before proceeding
- Handle errors gracefully (see error handling section)

### 2. Get Leaderboard (Optional)

```javascript
const leaderboard = await window.parent.getLeaderboard(gameTitle, limit);
```

**Parameters:**
- `gameTitle` (string) - Your game's exact title
- `limit` (number, optional) - Number of scores to return (default: 10)

**Returns:** Array of score objects
```javascript
[
    {
        id: 1737200000000,
        username: "player1",
        gameTitle: "Click Mania",
        score: 1500,
        timestamp: "2026-01-18T10:30:00.000Z"
    },
    // ... more scores
]
```

**Example:**
```javascript
async function showLeaderboard() {
    const topScores = await window.parent.getLeaderboard('Click Mania', 5);
    topScores.forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.username}: ${entry.score}`);
    });
}
```

### 3. Get Personal Best (Optional)

```javascript
const personalBest = await window.parent.getPersonalBest(gameTitle);
```

**Parameters:**
- `gameTitle` (string) - Your game's exact title

**Returns:** Number (highest score for current user, or 0 if none)

**Example:**
```javascript
async function displayPersonalBest() {
    const best = await window.parent.getPersonalBest('Click Mania');
    document.getElementById('bestScore').innerText = `Your Best: ${best}`;
}
```

## Complete Example

Here's a simple game that uses the Score API:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Game</title>
</head>
<body>
    <h1>Simple Clicker Game</h1>
    <p>Score: <span id="score">0</span></p>
    <button onclick="addPoints()">Click for Points</button>
    <button onclick="endGame()">Submit Score</button>

    <script>
        let score = 0;

        function addPoints() {
            score += 10;
            document.getElementById('score').innerText = score;
        }

        async function endGame() {
            // Submit score to platform
            if (window.parent && window.parent.saveGameScore) {
                await window.parent.saveGameScore(score);
                alert('Score submitted: ' + score);
            } else {
                alert('Score API not available');
            }
        }
    </script>
</body>
</html>
```

## Error Handling

Always check if the API is available before calling it:

```javascript
async function submitScore(scoreValue) {
    try {
        if (window.parent && window.parent.saveGameScore) {
            await window.parent.saveGameScore(scoreValue);
            console.log('Score saved successfully!');
        } else {
            console.log('Score API not available (not running in platform)');
        }
    } catch (error) {
        console.error('Error saving score:', error);
        alert('Failed to save score. Please try again.');
    }
}
```

## Important Notes

### Game Title Matching
- The platform automatically detects your game's title
- Leaderboards are organized by exact game title
- If you use `getLeaderboard()` or `getPersonalBest()`, make sure the title matches exactly

### User Authentication
- Users must be logged in to save scores
- The platform automatically handles authentication
- If a user isn't logged in, they'll see a login prompt

### Testing Your Game

**Outside the Platform:**
- The API functions won't be available
- Your game should handle this gracefully (see error handling)

**Inside the Platform:**
1. Upload your game as an admin
2. Play the game
3. Submit a score
4. Check the High Scores tab to verify it appears

## Score Data Structure

Each score record contains:

```javascript
{
    id: 1737200000000,           // Unique timestamp ID
    username: "player1",          // Who achieved the score
    gameTitle: "Click Mania",     // Your game's title
    score: 1500,                  // The score value
    timestamp: "2026-01-18..."    // When it was achieved
}
```

## Tips for Game Developers

1. **Call saveGameScore() once per game session** - Typically when the game ends
2. **Use meaningful score values** - Higher = better (leaderboards sort descending)
3. **Provide feedback** - Show players when their score is being saved
4. **Test thoroughly** - Play your game multiple times to ensure scores save correctly
5. **Handle offline play** - If the API isn't available, provide an alternative (local high score)

## Viewing Scores

Players can view all high scores by clicking the **High Scores** tab in the Yakawow platform. Scores are:
- Organized by game
- Ranked with medals (🥇🥈🥉) for top 3
- Highlighted when viewing your own scores
- Displayed with player name, score, and date

## Example: Full Game with Score API

See [example-game.html](example-game.html) for a complete working example that includes:
- Score submission
- Error handling
- Visual feedback
- Optional leaderboard integration

## Support

If you have questions about the Score API:
1. Check the example game for a working implementation
2. Verify your game is uploaded correctly to the platform
3. Test that users can authenticate before playing

---

**Happy coding!** 🎮
