// --- CLOUD CONFIGURATION (JSONBin.io) ---
const BIN_ID = "6966ce3443b1c97be92ea25a";
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// ⚠️ VITAL: You must paste your "Master Key" from jsonbin.io below.
// It starts with "$2b$10$..." or "$2a$10$..."
const API_KEY = "$2a$10$rLNJhoJMs00bpIHZI5LJlueE.7g3800UXxlRehqRoLgfgNApBiCHm";

var libraryData = { "Games": [], "Apps": [], "Announcements": [] };
var isAdmin = false;

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
                "X-Master-Key": API_KEY,
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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("defaultOpen").click();
    // Start Fetch
    fetchLibrary();
});
