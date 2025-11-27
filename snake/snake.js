// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// --- Firebase Setup ---
const firebaseConfig = {
    apiKey: "AIzaSyB6bCIp7FsrX3sCvtKe6DjHayCA32o1K2I",
    authDomain: "lucasrootorg-snake.firebaseapp.com",
    projectId: "lucasrootorg-snake",
    storageBucket: "lucasrootorg-snake.firebasestorage.app",
    messagingSenderId: "24548940286",
    appId: "1:24548940286:web:6d66680ab6c7a4541bc8af",
    measurementId: "G-CJWR506KQF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Authentication Logic
const initAuth = async () => {
    try {
        await signInAnonymously(auth);
        console.log("Signed in to Firebase");
        loadLeaderboard(); // Load scores after signing in
    } catch (error) {
        console.error("Error signing in:", error);
        document.getElementById("leaderboard-list").innerHTML = "<li>Offline Mode</li>";
    }
};

initAuth();

//---Game Setup---//
const canvas = document.getElementById("game-board");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("high-score");
const startBtn = document.getElementById("start-btn");
const controlsOverlay = document.getElementById("controls-overlay");
const pauseOverlay = document.getElementById("pause-overlay");
const highscoreForm = document.getElementById("highscore-form");
const usernameInput = document.getElementById("username-input");
const submitScoreBtn = document.getElementById("submit-score-btn");
const cancelBtn = document.getElementById("cancel-btn");
const leaderboardList = document.getElementById("leaderboard-list");
//showHighScoreForm(); //debug

//colors
const snakeColor = '#007bff';
const appleColor = 'rgb(163, 61, 61)';

const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE; //400/20 = 20 tiles

//Game vars
let score = 0;
//anti-tamper
let _secureScore = 0;
let gameStartTime = 0;
const _salt = 5829104; //random num for XOR encryption
let localhighScore = parseInt(localStorage.getItem("snakeHighScore")) || 0;
//snake and food structure
let snake = [{x: 10, y: 10}];
let food = {x: 15, y: 15};

//movement velocity
//dx: -1 = left, 1 = right
//dy: -1 = up, 1 = down
let dx = 0;
let dy = 0;

//input buffer
let inputQueue = [];

let gameInterval; //used to stop the game later
let isGameRunning = false;
let isPaused = false;
let newHighScoreReached = false;

//Mobile
let touchStartX = 0;
let touchStartY = 0;

highScoreElement.textContent = localhighScore;

function startGame() {
    if (isGameRunning) return; //exit if already running

    //reset
    snake = [{x: 10, y: 10}];
    dx = 0; dy = 0;
    score = 0;
    scoreElement.textContent = score;
    isGameRunning = true;
    inputQueue = [];
    newHighScoreReached = false;

    //hide controls and highscore form
    controlsOverlay.style.display = "none";
    highscoreForm.style.display = "none";

    gameStartTime = Date.now();

    //run gameLoop every 100ms
    gameInterval = setInterval(gameLoop, 100);
}

function incrementScore() {
    score++;
    _secureScore = (score ^ _salt); //XOR with salt
    scoreElement.textContent = score;
}

function isScoreValid() {
    return (_secureScore ^ _salt) === score;
}

function togglePause() {
    if (!isGameRunning) return;
    isPaused = !isPaused;
    if (isPaused) {
        pauseOverlay.style.display = "block";
    } else {
        pauseOverlay.style.display = "none";
    }
}

function gameOver() {
    clearInterval(gameInterval);
    isGameRunning = false;

    if (isCheating()) {
        controlsOverlay.style.display = "flex";
        startBtn.textContent = "Play Again";
        return;
    }
    if (newHighScoreReached) {
        showHighScoreForm();
    } else {
        controlsOverlay.style.display = "flex";
        startBtn.textContent = "Play Again";
    }    
}

function showHighScoreForm() {
    highscoreForm.style.display = "flex";
    usernameInput.focus();
}

function cancelForm() {
    highscoreForm.style.display = "none";
    controlsOverlay.style.display = "flex";
    startBtn.textContent = "Play Again";
    usernameInput.value = "";
}

function isCheating() {
    const timeElapsed = Date.now() - gameStartTime;
    const maxPossibleScore = Math.floor(timeElapsed/200);
    if (!isScoreValid() || score > maxPossibleScore) {
        alert("Begone H4CK3R HAHA. Don't mess with the score.");
        return true;
    }
}

// Submit Score to Firebase
async function submitScore() {
    if (isCheating()) {
        cancelForm();
        return;
    }
    let rawInput = usernameInput.value || "username";
    //clean input against XSS attacks
    const username = rawInput.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const user = auth.currentUser;

    if (user) {
        try {
            submitScoreBtn.textContent = "Saving...";
            submitScoreBtn.disabled = true;
            // Save to 'snake_scores' collection in the user's public data area
            const scoresCollection = collection(db, 'snake_scores');
            
            await addDoc(scoresCollection, {
                name: username,
                score: score,
                timestamp: Date.now(),
                uid: user.uid
            });
            
            console.log("Score saved!");
            highscoreForm.style.display = "none";
            controlsOverlay.style.display = "flex";
            startBtn.textContent = "Play Again";
            
            // Refresh leaderboard
            loadLeaderboard();
            
        } catch (e) {
            console.error("Error adding score: ", e);
            alert("Could not save score. Check console.");
        } finally {
            submitScoreBtn.textContent = "Submit";
            submitScoreBtn.disabled = false;
        }
    } else {
        alert("Not connected to leaderboard.");
        highscoreForm.style.display = "none";
        controlsOverlay.style.display = "flex";
        signInAnonymously(auth).then(() => {
            alert("Reconnected! Try again.");
        });
    }
}

if(cancelBtn) { cancelBtn.addEventListener("click", cancelForm); }
if(submitScoreBtn) { submitScoreBtn.addEventListener("click", submitScore); }

// Load Leaderboard from Firebase
async function loadLeaderboard() {
    const user = auth.currentUser;
    if (!user) return;

    const scoresCollection = collection(db, 'snake_scores');
    
    try {
        const q = query(scoresCollection, orderBy("score","desc"), limit(10));
        const querySnapshot = await getDocs(q);
        let scores = [];
        
        querySnapshot.forEach((doc) => {
            scores.push(doc.data());
        });

        if(leaderboardList) {
            // Render HTML
            leaderboardList.innerHTML = scores.map((entry, index) => {
            //escape any HTML
            const safeName = entry.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            return `
                <li>
                    <span>${index + 1}. ${safeName}</span>
                    <span>${entry.score}</span>
                </li>
            `}).join('');
        
            if (scores.length === 0) {
                leaderboardList.innerHTML = "<li>No scores yet.</li>";
            }
        }
    } catch (error) {
        console.error("Error loading leaderboard:", error);
        leaderboardList.innerHTML = "<li>Loading failed.</li>";
    }
}

function gameLoop() {
    if (!isGameRunning || isPaused) { return; }
    //anti-debug; when devtools open, the program hits breakpoint every 100ms
    (function(){debugger;})();
    
    processInput();
    moveSnake();
    drawGame();
}

function drawRect(x,y,color) {
    ctx.fillStyle = color;
    //x * GRID_SIZE converts grid coord to pixel coord
    //GRID_SIZE-2 makes snake slightly smaller than the grid
    ctx.fillRect(x*GRID_SIZE, y*GRID_SIZE, GRID_SIZE-2, GRID_SIZE-2);
}

function drawGame() {
    //clear screen
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    //draw food
    drawRect(food.x, food.y, appleColor);
    
    //draw snake
    snake.forEach((segment) => {
        drawRect(segment.x, segment.y, snakeColor);
    });
}

function processInput() {
    if (inputQueue.length > 0) {
        const nextMove = inputQueue.shift();

        const goingUp = dy === -1;
        const goingDown = dy === 1;
        const goingRight = dx === 1;
        const goingLeft = dx === -1;

        if (nextMove.type === 'Up' && !goingDown) {
            dx = 0; dy = -1;
        } else if (nextMove.type === 'Down' && !goingUp) {
            dx = 0; dy = 1;
        } else if (nextMove.type === 'Left' && !goingRight) {
            dx = -1; dy = 0;
        } else if (nextMove.type === 'Right' && !goingLeft) {
            dx = 1; dy = 0;
        }
    }
}

function moveSnake() {
    //start of game (stationary, don't check collisions or move)
    if (dx === 0 && dy === 0) return;

    //calculate new head
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    //check collision
    //walls
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT){
        return gameOver();
    }
    //self (use for instead of forEach to stop when collision detected)
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return gameOver();
        } 
    }
    //add new head
    snake.unshift(head);

    //did the snake eat food?
    if (head.x == food.x && head.y == food.y) {
        //update score and highscore
        incrementScore();
        scoreElement.textContent = score;
        //update highscore
        if (score > localhighScore) {
            localhighScore = score;
            localStorage.setItem("snakeHighScore", localhighScore);
            highScoreElement.textContent = localhighScore;
            newHighScoreReached = true;
        }
        placeFood();
    } else {
        //remove tail only if snake did not eat
        snake.pop();
    }
}

function placeFood(){
    food.x = Math.floor(Math.random() * TILE_COUNT);
    food.y = Math.floor(Math.random() * TILE_COUNT);
    
    //recursively call again if food spawns on snake tile
    for (let i = 0; i < snake.length; i++) {
        if (food.x === snake[i].x && food.y === snake[i].y) {
            placeFood();
        } 
    }
}

//start game
if (startBtn) startBtn.addEventListener("click", startGame);
//keyboard input
document.addEventListener("keydown", (event) => {
    //allow any key to start game
    if (!isGameRunning && highscoreForm && highscoreForm.style.display === "none" && event.key !== "Enter") {
        startGame();
    }

    //prevent scrolling when using arrow keys
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.code)) {
        event.preventDefault();
    }

    //keyboard shortcuts
    //ESCAPE - pause game or cancel highscore form
    if (event.code === "Escape") {
        if (highscoreForm.style.display === "flex") {
            cancelForm();
        } else if (isGameRunning) {
            togglePause();
        }
    }
    //ENTER - submit form
    if (event.code === "Enter") {
        if (highscoreForm.style.display === "flex") {
            submitScore();
        } else if (!isGameRunning && highscoreForm.style.display === "none") {
            startGame();
        }
    }
    //SPACE or P - toggle pause
    if ((event.code === "Space" || event.key.toLowerCase() === "p") && isGameRunning) {
        togglePause();
    }
    //unpause game with any move key
    if (isPaused) {
        if (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowRight" ||
            event.key.toLowerCase() === "w" || event.key.toLowerCase() === "a" ||
            event.key.toLowerCase() === "s" || event.key.toLowerCase() === "d") {
            togglePause();
        }
    }

    //DIRECTION; link input to velocity
    switch(event.key) {
        case "ArrowUp": case "w": inputQueue.push({ type: 'Up' }); break;
        case "ArrowDown": case "s": inputQueue.push({ type: 'Down' }); break;
        case "ArrowRight": case "d": inputQueue.push({ type: 'Right' }); break;
        case "ArrowLeft": case "a": inputQueue.push({ type: 'Left' }); break;
    }
});

//mobile
document.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, false);

document.addEventListener('touchmove',function(e) {
    //prevent scrolling if game running
    if (isGameRunning) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchend',function(e) {
    if(!isGameRunning) return;

    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;

    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;

    //avoid small swipes
    const threshold = 30;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        //horizontal swipe
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                inputQueue.push({ type: 'Right' });
            } else {
                inputQueue.push({ type: 'Left' });
            }
        }
    } else {
        //vertical swipe
        if (Math.abs(diffY) > threshold) {
            if (diffY > 0) {
                inputQueue.push({ type: 'Down' });
            } else {
                inputQueue.push({ type: 'Up' });
            }
        }
    }
}, false);