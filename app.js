// --- CLOUD CONFIGURATION (JSONBin.io) ---
const BIN_ID = "6966ce3443b1c97be92ea25a";
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// ⚠️ VITAL: You must paste your "Master Key" from jsonbin.io below.
// It starts with "$2b$10$..." or "$2a$10$..."
const API_KEY = "$2a$10$Wm87Q0b7.J7kNQfyu9jNkOLu/onc..IALNaKxKyDjSHeUReiOL05y";

// User authentication bin (you'll need to create a separate bin for users)
const USERS_BIN_ID = "696d461843b1c97be9395b64";
const USERS_API_URL = `https://api.jsonbin.io/v3/b/${USERS_BIN_ID}`;

// Scores bin (create a new bin on JSONBin.io and paste the ID here)
const SCORES_BIN_ID = "696d4dffae596e708fe53af0";
const SCORES_API_URL = `https://api.jsonbin.io/v3/b/${SCORES_BIN_ID}`;

var libraryData = { "Games": [], "Apps": [], "Announcements": [] };
var isAdmin = false;
var currentUser = null;
var isAuthMode = false;

// --- CLOUD FUNCTIONS ---

function showLoading(isLoading) {
    document.getElementById("loadingIndicator").style.display = isLoading ? "inline" : "none";
}

function showStatus(msg) {
    var el = document.getElementById("statusMessage");
    el.innerText = msg;
    el.style.display = "block";
    setTimeout(() => { el.style.display = "none"; }, 3000);
}

async function fetchLibrary() {
    if (API_KEY === "PASTE_YOUR_MASTER_KEY_HERE") {
        alert("⚠️ SETUP REQUIRED: You must add your JSONBin 'Master Key' in the code to load data.");
        return;
    }

    showLoading(true);
    try {
        // JSONBin V3 requires X-Master-Key header
        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "X-Access-Key": API_KEY,
                "X-Bin-Meta": "false" // This strips the 'record' wrapper
            }
        });

        if (!response.ok) throw new Error("Network response was not ok: " + response.status);

        const data = await response.json();

        // FIX: Remove .record because X-Bin-Meta: false returns the raw data directly
        libraryData = data || { "Games": [], "Apps": [], "Announcements": [] };

        // Safety init
        if (!libraryData.Announcements) libraryData.Announcements = [];
        if (!libraryData.Games) libraryData.Games = [];
        if (!libraryData.Apps) libraryData.Apps = [];

        renderAll();
        showStatus("✅ Synced with Cloud");
    } catch (error) {
        console.error("Fetch error:", error);
        showStatus("❌ Connection Failed");
    } finally {
        showLoading(false);
    }
}

async function saveLibraryToCloud() {
    if (API_KEY === "PASTE_YOUR_MASTER_KEY_HERE") {
        alert("⚠️ Cannot Save: Missing API Key.");
        return;
    }

    showLoading(true);
    try {
        // JSONBin uses PUT to update existing bins
        const response = await fetch(API_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": API_KEY
            },
            body: JSON.stringify(libraryData)
        });

        if (!response.ok) throw new Error("Save failed: " + response.status);
        showStatus("✅ Saved to Cloud");
    } catch (error) {
        console.error("Save error:", error);
        alert("Error saving to cloud: " + error.message);
    } finally {
        showLoading(false);
    }
}

// --- TAB LOGIC ---
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) { tablinks[i].className = tablinks[i].className.replace(" active", ""); }
    document.getElementById(tabName).style.display = "block";
    if (evt) evt.currentTarget.className += " active";
}

// --- LOGIN LOGIC ---
function attemptLogin() {
    var password = prompt("Enter Admin Password:");
    if (password === "deathtrap") {
        alert("Access Granted. Cloud Edit mode enabled.");
        isAdmin = true;
        document.getElementById("adminTabBtn").style.display = "block";
        document.getElementById("adminTabBtn").click();
        renderAll();
    } else if (password != null) {
        alert("Access Denied.");
    }
}

// --- HELPER: Placeholder Text ---
function updatePlaceholder() {
    var cat = document.getElementById("itemCategory").value;
    var textArea = document.getElementById("itemCode");
    if (cat === "Announcements") {
        textArea.placeholder = "Type your news message here...";
    } else {
        textArea.placeholder = "<html>... your game/app code here ...</html>";
    }
}

function renderAll() {
    renderLibrary("Games");
    renderLibrary("Apps");
    renderLibrary("Announcements");
}

// --- LIBRARY LOGIC ---
async function addToLibrary() {
    var title = document.getElementById("itemTitle").value;
    var category = document.getElementById("itemCategory").value;
    var code = document.getElementById("itemCode").value;

    if (title.trim() === "" || code.trim() === "") {
        alert("Please fill in a Title and Code/Message.");
        return;
    }

    // 1. Fetch latest first to avoid overwriting others' work
    await fetchLibrary();

    var newItem = { id: Date.now(), title: title, code: code };

    if (!libraryData[category]) libraryData[category] = [];
    libraryData[category].push(newItem);

    // 2. Save
    await saveLibraryToCloud();
    renderLibrary(category);

    document.getElementById("itemTitle").value = "";
    document.getElementById("itemCode").value = "";
}

function renderLibrary(category) {
    var container = document.getElementById(category + "Library");
    if (!container) return;

    container.innerHTML = "";
    var items = libraryData[category];

    if (!items || items.length === 0) {
        if (category === "Announcements") {
            container.innerHTML = "<p style='color:#666; font-style:italic;'>No announcements yet.</p>";
        } else {
            container.innerHTML = "<p>No items found.</p>";
        }
        return;
    }

    // Iterate backwards (Newest First)
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        var card = document.createElement("div");

        var deleteBtnHTML = "";
        var exportBtnHTML = "";

        if (isAdmin) {
            deleteBtnHTML = `<button class="delete-card-btn" onclick="deleteItem(event, '${category}', ${item.id})">Del</button>`;
            exportBtnHTML = `<button class="export-card-btn" onclick="exportItem(event, '${category}', ${item.id})">Share</button>`;
        }

        if (category === "Announcements") {
            card.className = "announcement-card";
            card.innerHTML = `
                ${deleteBtnHTML}
                ${exportBtnHTML}
                <span class="announcement-title"></span>
                <div class="announcement-text"></div>
            `;
            card.querySelector(".announcement-title").innerText = item.title;
            card.querySelector(".announcement-text").innerText = item.code;
        } else {
            card.className = "game-card";
            var icon = category === "Games" ? "🎮" : "📱";
            card.innerHTML = `
                ${deleteBtnHTML}
                ${exportBtnHTML}
                <span class="game-icon">${icon}</span>
                <span class="game-title"></span>
            `;
            card.querySelector(".game-title").innerText = item.title;

            card.onclick = function (e) {
                if (e.target.className !== 'delete-card-btn' && e.target.className !== 'export-card-btn') {
                    playItem(category, item.id);
                }
            };
        }
        container.appendChild(card);
    }
}

function playItem(category, id) {
    if (category === "Announcements") return;
    var items = libraryData[category];
    var selectedItem = items.find(item => item.id === id);
    if (!selectedItem) return;

    var player = document.getElementById(category + "Player");
    player.style.display = "flex";

    var titleId = category === "Games" ? "ActiveGameTitle" : "ActiveAppTitle";
    document.getElementById(titleId).innerText = selectedItem.title;

    document.body.style.overflow = "hidden";

    var container = document.getElementById(category + "FrameContainer");
    container.innerHTML = "";

    var iframe = document.createElement('iframe');
    iframe.className = "game-frame";
    iframe.onload = function () { iframe.focus(); };
    container.appendChild(iframe);

    var doc = iframe.contentWindow.document;
    doc.open();
    doc.write(selectedItem.code);
    doc.close();
}

function closeItem(category) {
    document.getElementById(category + "FrameContainer").innerHTML = "";
    document.getElementById(category + "Player").style.display = "none";
    document.body.style.overflow = "auto";
}

async function deleteItem(event, category, id) {
    event.stopPropagation();
    if (confirm("Delete this item from the Cloud?")) {
        // Fetch latest first
        await fetchLibrary();

        libraryData[category] = libraryData[category].filter(item => item.id !== id);

        await saveLibraryToCloud();
        renderLibrary(category);
    }
}

async function clearCloudData() {
    if (confirm("ARE YOU SURE? This will wipe the ENTIRE cloud bin for everyone.")) {
        libraryData = { "Games": [], "Apps": [], "Announcements": [] };
        await saveLibraryToCloud();
        renderAll();
    }
}

// --- MIGRATION TOOL ---
async function uploadLocalToCloud() {
    var localDataString = localStorage.getItem("yakawowData") || localStorage.getItem("yakattackData");
    if (!localDataString) {
        alert("No local data found in this browser.");
        return;
    }

    if (!confirm("This will overwrite the current Cloud data with your local browser data. Proceed?")) return;

    try {
        var localData = JSON.parse(localDataString);
        // Assign local to global library
        libraryData = localData;

        // Ensure structure
        if (!libraryData.Announcements) libraryData.Announcements = [];

        await saveLibraryToCloud();
        alert("Success! Your local games are now on the Cloud.");
        renderAll();
    } catch (e) {
        alert("Error reading local data: " + e);
    }
}

// --- SHARE MENU LOGIC ---
function exportCurrentInput() {
    var title = document.getElementById("itemTitle").value;
    var category = document.getElementById("itemCategory").value;
    var code = document.getElementById("itemCode").value;

    if (title.trim() === "" || code.trim() === "") {
        alert("Please fill in Title and Content before exporting.");
        return;
    }
    prepareShareModal(title, category, code);
}

function exportItem(event, category, id) {
    event.stopPropagation();
    var items = libraryData[category];
    var item = items.find(i => i.id === id);
    if (item) {
        prepareShareModal(item.title, category, item.code);
    }
}

function prepareShareModal(title, category, code) {
    var dataObj = { title: title, category: category, code: code };
    var jsonString = JSON.stringify(dataObj);
    var encodedString = btoa(encodeURIComponent(jsonString));

    document.getElementById("shareOutput").value = encodedString;
    document.getElementById("ShareModal").style.display = "flex";
}

function copyShareCode() {
    var copyText = document.getElementById("shareOutput");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value).then(function () {
        alert("✅ Code Copied!");
        closeShareModal();
    }, function () {
        alert("Failed to copy. Please copy manually.");
    });
}

function closeShareModal() {
    document.getElementById("ShareModal").style.display = "none";
}

// --- IMPORT LOGIC ---
async function importFromCode() {
    var pastedCode = prompt("Paste your Game/App/News Code here:");
    if (pastedCode == null || pastedCode.trim() == "") return;

    try {
        var jsonString = decodeURIComponent(atob(pastedCode));
        var dataObj = JSON.parse(jsonString);

        if (!dataObj.title || !dataObj.category || !dataObj.code) {
            throw new Error("Invalid Code Format");
        }

        // Fetch latest to ensure we don't overwrite
        await fetchLibrary();

        if (!libraryData[dataObj.category]) {
            libraryData[dataObj.category] = [];
        }

        var newItem = {
            id: Date.now(),
            title: dataObj.title,
            code: dataObj.code
        };

        libraryData[dataObj.category].push(newItem);
        await saveLibraryToCloud();

        renderAll();
        alert("Successfully imported to Cloud: " + dataObj.title);

    } catch (err) {
        alert("Error: Invalid code.");
        console.error(err);
    }
}

// --- AUTHENTICATION FUNCTIONS ---

function generateRandomPassword(numWords = 2, separator = '-') {
    // Common word list - you can expand this significantly
    const wordList = [
        'apple', 'banana', 'cherry', 'dragon', 'eagle', 'forest', 'garden', 'happy',
        'island', 'jungle', 'kitten', 'lemon', 'moon', 'ninja', 'ocean', 'panda',
        'queen', 'river', 'sunset', 'tiger', 'unicorn', 'violet', 'wizard', 'yellow',
        'zebra', 'anchor', 'bridge', 'castle', 'diamond', 'ember', 'flame', 'galaxy',
        'harbor', 'iron', 'jazz', 'knight', 'lotus', 'magic', 'nebula', 'orbit',
        'phoenix', 'quartz', 'rocket', 'storm', 'thunder', 'ultra', 'vortex', 'wave',
        'xenon', 'yoga', 'alpine', 'blaze', 'cosmos', 'delta', 'echo',
        'frost', 'glow', 'hero', 'iris', 'jade', 'kilo', 'laser', 'metro',
        'nova', 'opal', 'prism', 'quest', 'radar', 'solar', 'tempo', 'unity',
        'vapor', 'winter', 'xray', 'youth', 'zenith', 'amber', 'bolt', 'cloud'
    ];

    const array = new Uint32Array(numWords);
    crypto.getRandomValues(array);

    const words = [];
    for (let i = 0; i < numWords; i++) {
        const randomIndex = array[i] % wordList.length;
        words.push(wordList[randomIndex]);
    }

    // Optional: Add a random number at the end for extra security
    const numberArray = new Uint32Array(1);
    crypto.getRandomValues(numberArray);
    const randomNumber = numberArray[0] % 100;

    return words.join(separator) + separator + randomNumber;
}

// Examples:
// generateRandomPassword(4, '-')  → "dragon-sunset-nebula-wizard-73"
// generateRandomPassword(3, '.')  → "tiger.cosmos.anchor.42"
// generateRandomPassword(5)       → "ocean-castle-phoenix-lunar-frost-91"

async function fetchUsers() {
    if (USERS_BIN_ID === "PASTE_YOUR_USERS_BIN_ID_HERE") {
        console.error("Users bin not configured");
        return null;
    }

    try {
        const response = await fetch(USERS_API_URL, {
            method: "GET",
            headers: {
                "X-Master-Key": API_KEY,
                "X-Bin-Meta": "false"
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return { users: [] };
            }
            throw new Error("Failed to fetch users: " + response.status);
        }

        const data = await response.json();
        return data || { users: [] };
    } catch (error) {
        console.error("Fetch users error:", error);
        return null;
    }
}

async function saveUsers(usersData) {
    if (USERS_BIN_ID === "PASTE_YOUR_USERS_BIN_ID_HERE") {
        alert("⚠️ Users bin not configured. Please create a bin for user data.");
        return false;
    }

    try {
        const response = await fetch(USERS_API_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": API_KEY
            },
            body: JSON.stringify(usersData)
        });

        if (!response.ok) throw new Error("Save users failed: " + response.status);
        return true;
    } catch (error) {
        console.error("Save users error:", error);
        return false;
    }
}

function toggleAuthMode() {
    isAuthMode = !isAuthMode;
    const loginSection = document.getElementById("loginPasswordSection");
    const signupSection = document.getElementById("signupSection");
    const toggleBtn = document.getElementById("toggleAuthBtn");
    const authMessage = document.getElementById("authMessage");

    if (isAuthMode) {
        loginSection.style.display = "none";
        signupSection.style.display = "block";
        toggleBtn.innerText = "Back to Login";
        authMessage.innerText = "Create a new account";
    } else {
        loginSection.style.display = "block";
        signupSection.style.display = "none";
        toggleBtn.innerText = "Create New Account";
        authMessage.innerText = "Please log in or create an account to continue.";
        document.getElementById("generatedPasswordDisplay").style.display = "none";
    }
}

async function handleSignup() {
    const username = document.getElementById("authUsername").value.trim();

    if (!username) {
        alert("Please enter a username.");
        return;
    }

    const usersData = await fetchUsers();
    if (!usersData) {
        alert("Error connecting to authentication server.");
        return;
    }

    const existingUser = usersData.users.find(u => u.username === username);
    if (existingUser) {
        alert("Username already exists. Please choose a different username.");
        return;
    }

    const password = generateRandomPassword();

    document.getElementById("generatedPasswordText").innerText = password;
    document.getElementById("generatedPasswordDisplay").style.display = "block";
    document.getElementById("createAccountBtn").style.display = "none";

    usersData.users.push({
        username: username,
        password: password,
        createdAt: new Date().toISOString()
    });

    const saved = await saveUsers(usersData);
    if (saved) {
        alert("Account created successfully! Make sure to save your password.");
    } else {
        alert("Error creating account. Please try again.");
    }
}

function copyGeneratedPassword() {
    const passwordText = document.getElementById("generatedPasswordText").innerText;
    navigator.clipboard.writeText(passwordText).then(function () {
        alert("✅ Password copied to clipboard!");
    }, function () {
        alert("Failed to copy. Please copy manually.");
    });
}

async function handleLogin() {
    const username = document.getElementById("authUsername").value.trim();
    const password = document.getElementById("authPassword").value;

    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    const usersData = await fetchUsers();
    if (!usersData) {
        alert("Error connecting to authentication server.");
        return;
    }

    const user = usersData.users.find(u => u.username === username && u.password === password);

    if (user) {
        currentUser = username;
        sessionStorage.setItem("authenticatedUser", username);
        updateUsernameLabel();
        closeAuthModal();
        fetchLibrary();
    } else {
        alert("Invalid username or password.");
    }
}

function closeAuthModal() {
    document.getElementById("AuthModal").style.display = "none";
    document.body.style.overflow = "auto";
}

function updateUsernameLabel() {
    const usernameLabel = document.getElementById("usernameLabel");
    if (currentUser) {
        usernameLabel.innerText = `Hi ${currentUser}!`;
    } else {
        usernameLabel.innerText = "";
    }
}

function checkAuthentication() {
    const storedUser = sessionStorage.getItem("authenticatedUser");
    if (storedUser) {
        currentUser = storedUser;
        updateUsernameLabel();
        return true;
    }
    return false;
}

function showAuthModal() {
    document.getElementById("AuthModal").style.display = "flex";
    document.body.style.overflow = "hidden";
}

function handleLogout() {
    // Clear session storage
    sessionStorage.removeItem("authenticatedUser");

    // Reset current user
    currentUser = null;
    updateUsernameLabel();

    // Reset admin state
    isAdmin = false;
    document.getElementById("adminTabBtn").style.display = "none";

    // Clear library data
    libraryData = { "Games": [], "Apps": [], "Announcements": [] };
    renderAll();

    // Switch to Home tab
    document.getElementById("defaultOpen").click();

    // Show authentication modal (cannot be closed until login)
    showAuthModal();

    // Reset auth form
    document.getElementById("authUsername").value = "";
    document.getElementById("authPassword").value = "";
    if (isAuthMode) {
        toggleAuthMode();
    }
}

// --- SCORE TRACKING FUNCTIONS ---

async function fetchScores() {
    if (SCORES_BIN_ID === "PASTE_YOUR_SCORES_BIN_ID_HERE") {
        console.error("Scores bin not configured");
        return { scores: [] };
    }

    try {
        const response = await fetch(SCORES_API_URL, {
            method: "GET",
            headers: {
                "X-Master-Key": API_KEY,
                "X-Bin-Meta": "false"
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return { scores: [] };
            }
            throw new Error("Failed to fetch scores: " + response.status);
        }

        const data = await response.json();
        return data || { scores: [] };
    } catch (error) {
        console.error("Fetch scores error:", error);
        return { scores: [] };
    }
}

async function saveScores(scoresData) {
    if (SCORES_BIN_ID === "PASTE_YOUR_SCORES_BIN_ID_HERE") {
        console.error("Scores bin not configured");
        return false;
    }

    try {
        const response = await fetch(SCORES_API_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": API_KEY
            },
            body: JSON.stringify(scoresData)
        });

        if (!response.ok) throw new Error("Save scores failed: " + response.status);
        return true;
    } catch (error) {
        console.error("Save scores error:", error);
        return false;
    }
}

// This function is called by games running in iframes
async function saveGameScore(scoreValue) {
    if (!currentUser) {
        alert("Please log in to save scores.");
        return;
    }

    // Get current game title from the active player
    const activeGameTitle = document.getElementById("ActiveGameTitle")?.innerText
        || document.getElementById("ActiveAppTitle")?.innerText
        || "Unknown Game";

    showLoading(true);

    const scoresData = await fetchScores();

    // Find existing score for this user and game
    const existingScoreIndex = scoresData.scores.findIndex(
        s => s.username === currentUser && s.gameTitle === activeGameTitle
    );

    if (existingScoreIndex !== -1) {
        // User already has a score for this game
        const existingScore = scoresData.scores[existingScoreIndex];

        if (scoreValue > existingScore.score) {
            // New score is better - update it
            scoresData.scores[existingScoreIndex] = {
                id: Date.now(),
                username: currentUser,
                gameTitle: activeGameTitle,
                score: scoreValue,
                timestamp: new Date().toISOString()
            };
        } else {
            // New score is not better - don't save it
            showLoading(false);
            showStatus(`Current best: ${existingScore.score}. Score not saved.`);
            return;
        }
    } else {
        // First score for this user and game
        scoresData.scores.push({
            id: Date.now(),
            username: currentUser,
            gameTitle: activeGameTitle,
            score: scoreValue,
            timestamp: new Date().toISOString()
        });
    }

    const saved = await saveScores(scoresData);

    showLoading(false);

    if (saved) {
        showStatus(`✅ Score saved: ${scoreValue}`);
    } else {
        showStatus("❌ Failed to save score");
    }
}

// Get leaderboard for a specific game
async function getLeaderboard(gameTitle, limit = 10) {
    const scoresData = await fetchScores();

    return scoresData.scores
        .filter(s => s.gameTitle === gameTitle)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

// Get user's personal best for a game
async function getPersonalBest(gameTitle) {
    if (!currentUser) return 0;

    const scoresData = await fetchScores();

    const userScores = scoresData.scores
        .filter(s => s.gameTitle === gameTitle && s.username === currentUser)
        .sort((a, b) => b.score - a.score);

    return userScores.length > 0 ? userScores[0].score : 0;
}

// Render the high scores page
async function renderHighScores() {
    const container = document.getElementById("highScoresContainer");
    if (!container) return;

    showLoading(true);
    container.innerHTML = "<p>Loading scores...</p>";

    const scoresData = await fetchScores();

    showLoading(false);

    if (!scoresData.scores || scoresData.scores.length === 0) {
        container.innerHTML = "<p style='color:#666; font-style:italic;'>No scores recorded yet. Play some games!</p>";
        return;
    }

    // Group scores by game
    const gameGroups = {};
    scoresData.scores.forEach(score => {
        if (!gameGroups[score.gameTitle]) {
            gameGroups[score.gameTitle] = [];
        }
        gameGroups[score.gameTitle].push(score);
    });

    // Sort each game's scores and render
    let html = "";
    Object.keys(gameGroups).sort().forEach(gameTitle => {
        const gameScores = gameGroups[gameTitle]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Top 10 per game

        html += `<div class="game-scores-section">`;
        html += `<h3>🎮 ${gameTitle}</h3>`;
        html += `<table class="scores-table">`;
        html += `<tr><th>Rank</th><th>Player</th><th>Score</th><th>Date</th></tr>`;

        gameScores.forEach((score, index) => {
            const date = new Date(score.timestamp).toLocaleDateString();
            const rankEmoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
            const isCurrentUser = score.username === currentUser ? " class='current-user-score'" : "";

            html += `<tr${isCurrentUser}>`;
            html += `<td>${rankEmoji}</td>`;
            html += `<td>${score.username}</td>`;
            html += `<td><strong>${score.score}</strong></td>`;
            html += `<td>${date}</td>`;
            html += `</tr>`;
        });

        html += `</table></div>`;
    });

    container.innerHTML = html;
}

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("defaultOpen").click();

    if (!checkAuthentication()) {
        showAuthModal();
    } else {
        fetchLibrary();
    }
});
