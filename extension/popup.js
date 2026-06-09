const firebaseConfig = {
    apiKey: "AIzaSyA9wKFVXmT6kUpuaBgwlPilF86LaKKDYFU",
    authDomain: "money-digger-9b05e.firebaseapp.com",
    databaseURL: "https://money-digger-9b05e-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "money-digger-9b05e",
    storageBucket: "money-digger-9b05e.firebasestorage.app",
    messagingSenderId: "883506536944",
    appId: "1:883506536944:web:921b342dff76154fcbbd35"
};

const lgApp = firebase.initializeApp(firebaseConfig, 'lucky-guy-ext');
const db = lgApp.database().ref('luckyGuyScores');

window.currentPlayerName = "";
window.currentLevel = 1;
window.isSpinning = false;
window.currentRotation = Math.floor(Math.random() * 360);

const wheelColors = ['#00e5ff', '#ff44aa', '#00ff88', '#ffdd00', '#ff8844', '#b344ff'];
let personalSave = null;

const startUI = document.getElementById('start-ui');
const gameUI = document.getElementById('game-ui');
const levelText = document.getElementById('level-text');
const instruction = document.getElementById('instruction');
const guessInput = document.getElementById('guess-input');
const resultMessage = document.getElementById('result-message');
const spinBtn = document.getElementById('spin-btn');
const canvas = document.getElementById('wheel-canvas');
const ctx = canvas.getContext('2d');
const saveStatusEl = document.getElementById('save-status');
const displayNameEl = document.getElementById('display-name');
const nameInput = document.getElementById('name-input');

canvas.style.transform = `rotate(${window.currentRotation}deg)`;

// Load saved data
function loadSavedData() {
    chrome.storage.local.get(['luckyGuySaveData', 'playerName'], (data) => {
        personalSave = data.luckyGuySaveData || null;
        window.currentPlayerName = data.playerName || '';
        updateStartUI();
    });
}

function updateStartUI() {
    if (window.currentPlayerName) {
        displayNameEl.textContent = window.currentPlayerName;
        nameInput.style.display = 'none';
        if (personalSave && personalSave.name === window.currentPlayerName) {
            saveStatusEl.innerText = 'Opgeslagen op level ' + personalSave.level;
        }
    } else {
        displayNameEl.style.display = 'none';
        nameInput.style.display = 'block';
        nameInput.focus();
    }
}

window.startGame = function() {
    const name = window.currentPlayerName || nameInput.value.trim();
    if (!name) {
        saveStatusEl.innerText = 'Voer je naam in!';
        return;
    }

    window.currentPlayerName = name;
    chrome.storage.local.set({ playerName: name });

    if (personalSave && personalSave.name === name) {
        window.currentLevel = personalSave.level;
    } else {
        window.currentLevel = 1;
    }

    savePersonalProgress();
    startUI.style.display = 'none';
    gameUI.style.display = 'flex';
    updateUI();
};

function savePersonalProgress() {
    const saveData = { name: window.currentPlayerName, level: window.currentLevel };
    chrome.storage.local.set({ luckyGuySaveData: saveData });
    personalSave = saveData;
}

function getSecureRandomNumber(maxNumber) {
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    return (randomBuffer[0] % maxNumber) + 1;
}

function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sliceAngle = (2 * Math.PI) / window.currentLevel;

    for (let i = 0; i < window.currentLevel; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, i * sliceAngle, (i + 1) * sliceAngle);
        ctx.fillStyle = wheelColors[i % wheelColors.length];
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#12121a";
        ctx.stroke();

        if (window.currentLevel <= 80) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(i * sliceAngle + sliceAngle / 2);
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#000";
            const fontSize = Math.max(12, 35 - (window.currentLevel / 2));
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.fillText(i + 1, radius - 20, 0);
            ctx.restore();
        }
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a1a28";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#00e5ff";
    ctx.stroke();
}

function updateUI() {
    levelText.innerText = window.currentLevel;
    instruction.innerText = `Pick a number between 1 and ${window.currentLevel}`;
    guessInput.value = '';
    guessInput.max = window.currentLevel;
    resultMessage.innerText = '';
    drawWheel();
}

window.spinWheel = function() {
    if (window.isSpinning) return;

    const guess = parseInt(guessInput.value);

    if (isNaN(guess) || guess < 1 || guess > window.currentLevel) {
        resultMessage.style.color = '#ff8844';
        resultMessage.innerText = 'Enter a valid number!';
        return;
    }

    window.isSpinning = true;
    spinBtn.disabled = true;
    resultMessage.style.color = '#fff';
    resultMessage.innerText = 'Spinning...';

    const winningNumber = getSecureRandomNumber(window.currentLevel);

    const sliceAngleDeg = 360 / window.currentLevel;
    const middleAngle = (winningNumber - 1 + 0.5) * sliceAngleDeg;

    const randomOffset = (Math.random() * 0.8 - 0.4) * sliceAngleDeg;
    const targetDegree = 270 - middleAngle + randomOffset;

    const spinRounds = Math.floor(Math.random() * 8) + 5;
    const extraSpins = spinRounds * 360;

    const currentMod = window.currentRotation % 360;
    let diff = targetDegree - currentMod;
    if (diff < 0) diff += 360;

    window.currentRotation += extraSpins + diff;

    const spinDuration = Math.random() * 3.5 + 4;

    canvas.style.transition = `transform ${spinDuration}s cubic-bezier(0.15, 0.85, 0.1, 1)`;
    canvas.style.transform = `rotate(${window.currentRotation}deg)`;

    setTimeout(() => {
        checkResult(guess, winningNumber);
    }, spinDuration * 1000);
};

function checkResult(guess, winningNumber) {
    if (guess === winningNumber) {
        resultMessage.style.color = '#00ff88';
        resultMessage.innerText = `BINGO! It was ${winningNumber}.`;

        saveScoreToFirebase(window.currentLevel);

        setTimeout(() => {
            window.currentLevel++;
            savePersonalProgress();
            updateUI();
            window.isSpinning = false;
            spinBtn.disabled = false;
        }, 2000);
    } else {
        resultMessage.style.color = '#ff44aa';
        resultMessage.innerText = `WRONG! It was ${winningNumber}. Try again!`;

        setTimeout(() => {
            window.currentRotation = Math.floor(Math.random() * 360);
            canvas.style.transition = 'none';
            canvas.style.transform = `rotate(${window.currentRotation}deg)`;

            updateUI();
            window.isSpinning = false;
            spinBtn.disabled = false;
        }, 2500);
    }
}

async function saveScoreToFirebase(levelReached) {
    try {
        const playerRef = db.child(window.currentPlayerName);
        const snap = await playerRef.once('value');
        const existing = snap.val();
        if (!existing || levelReached > (existing.level || 0)) {
            await playerRef.set({ name: window.currentPlayerName, level: levelReached });
        }
    } catch (e) {
        console.error("Error saving score: ", e);
    }
}

// Initialize on load
loadSavedData();
