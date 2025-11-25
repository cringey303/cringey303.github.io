const canvas = document.getElementById("game-board");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("high-score");
const startBtn = document.getElementById("start-btn");

//colors
const snakeColor = '#007bff';
const appleColor = rgb(163, 61, 61);
const trophyColor = rgb(197, 197, 31);

const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE; //400/20 = 20 tiles

//Game vars
let score = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;

//snake
let snake = [{x: 10, y: 10}];
let food = {x: 15, y: 15};

//movement velocity
//x: -1 = left, 1 = right
//y: -1 = up, 1 = down
let dx = 0;
let dy = 0;

let gameInterval; //used to stop the game later
let isGameRunning = false;

highScoreElement.textContent = highScore;

function startGame() {
    if (isGameRunning) return; //exit if already running

    //reset
    snake = [{x: 10, y: 10}];
    dx = 0; dy = 0;
    score = 0;
    scoreElement.textContent = score;
    isGameRunning = true;

    //hide start button
    startBtn.style.display = "none";
    //run gameLoop every 100ms
    gameInterval = setInterval(gameLoop, 100);
}

function gameLoop() {
    moveSnake();
    if (isGameRunning) {
        drawGame();
    }
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

function moveSnake() {
    //check collision
    //walls
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT){
        return gameOver();
    }
    //self
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return gameOver();
        } 
    }
    //calculate and add new head
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    //did the snake eat food?
    if (head.x == food.x && head.y == food.y) {
        //update score and highscore
        score++;
        scoreElement.textContent = score;
        //update highscore
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("snakeHighScore", highScore);
            highScoreElement.textContent = highScore;
        }

        placeFood();
    } else {
        //remove tail only if snake did not eat
        snake.pop();
    }

}

//keyboard input
document.addEventListener("keydown", (event) => {
    if (!isGameRunning) return;

    //prevent scrolling when using arrow keys
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.code)) {
        event.preventDefault();
    }

    switch(event.key) {
        case "ArrowUp" || "w":
            //only go up if not going down
            if (dy !== 1) { dx = 0; dy = -1; } 
            break;
        case "ArrowDown" || "s":
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case "ArrowRight" || "d":
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
        case "ArrowLeft" || "a":
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
    }
});