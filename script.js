const menu = document.getElementById("menu");
const game = document.getElementById("game");
const puzzle = document.getElementById("puzzle");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const menuBtn = document.getElementById("menu-btn");
const winPopup = document.getElementById("win");
const winMain = document.getElementById("win-main");
const countdownScreen = document.getElementById("countdown");
const countNum = document.getElementById("count-num");
const movesDisplay = document.getElementById("moves");
const finalMoves = document.getElementById("final-moves");

let gridSize = 3;
let tiles = [];
let emptyIndex;
let moveCount = 0;
let imgIndex = 1;

// One extra tile for image (bottom row)
function totalTiles() {
  return gridSize * gridSize + 1;
}

// Mode select
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    gridSize = parseInt(btn.dataset.size);
    startBtn.disabled = false;
  });
});

// Start game with countdown
startBtn.addEventListener("click", () => {
  menu.classList.remove("active");
  countdownScreen.classList.add("active");
  startCountdown(3);
});

function startCountdown(num) {
  let count = num;
  countNum.textContent = count;
  const timer = setInterval(() => {
    count--;
    if (count === 0) {
      clearInterval(timer);
      countdownScreen.classList.remove("active");
      startGame();
    } else {
      countNum.textContent = count;
    }
  }, 1000);
}

function startGame() {
  game.classList.remove("hidden");
  game.classList.add("active");
  puzzle.innerHTML = "";
  tiles = [];
  moveCount = 0;
  movesDisplay.textContent = `Moves: ${moveCount}`;

  // cycle image
  imgIndex++;
  if (imgIndex > 5) imgIndex = 1;

  puzzle.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  puzzle.style.gridTemplateRows = `repeat(${gridSize + 1}, 1fr)`; // extra row

  for (let i = 0; i < totalTiles(); i++) {
    const div = document.createElement("div");
    div.classList.add("tile");

    if (i === totalTiles() - 1) {
      div.classList.add("empty");
      emptyIndex = i;
    } else {
      const x = i % gridSize;
      const y = Math.floor(i / gridSize);
      div.style.backgroundImage = `url(images/img${imgIndex}.png)`;
      div.style.backgroundSize = `${gridSize * 100}% ${(gridSize + 1) * 100}%`;
      div.style.backgroundPosition = `${(x / (gridSize - 1)) * 100}% ${(y / gridSize) * 100}%`;
      div.addEventListener("click", () => tryMove(i));
    }

    tiles.push(div);
    puzzle.appendChild(div);
  }

  shuffleTiles();
}

function shuffleTiles() {
  for (let i = 0; i < 120; i++) {
    const moves = getMovableTiles();
    const rand = moves[Math.floor(Math.random() * moves.length)];
    swapTiles(rand);
  }
}

function getMovableTiles() {
  const row = Math.floor(emptyIndex / gridSize);
  const col = emptyIndex % gridSize;
  const moves = [];

  if (row > 0) moves.push(emptyIndex - gridSize);
  if (row < gridSize) moves.push(emptyIndex + gridSize);
  if (col > 0) moves.push(emptyIndex - 1);
  if (col < gridSize - 1) moves.push(emptyIndex + 1);

  return moves.filter(i => i >= 0 && i < totalTiles() - 1);
}

function tryMove(i) {
  const moves = getMovableTiles();
  if (moves.includes(i)) {
    slideTile(i);
    moveCount++;
    movesDisplay.textContent = `Moves: ${moveCount}`;
  }
}

function slideTile(i) {
  const tile = tiles[i];
  const emptyTile = tiles[emptyIndex];
  const rect1 = tile.getBoundingClientRect();
  const rect2 = emptyTile.getBoundingClientRect();

  tile.style.transition = "transform 0.2s ease-in-out";
  tile.style.transform = `translate(${rect2.left - rect1.left}px, ${rect2.top - rect1.top}px)`;

  setTimeout(() => {
    tile.style.transition = "none";
    tile.style.transform = "none";
    swapTiles(i);
    checkWin();
  }, 200);
}

function swapTiles(i) {
  [tiles[i], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[i]];
  puzzle.innerHTML = "";
  tiles.forEach((t) => puzzle.appendChild(t));
  emptyIndex = i;
}

function checkWin() {
  const correct = tiles.every((t, i) => !t.classList.contains("empty") || i === totalTiles() - 1);
  if (correct) {
    finalMoves.textContent = `Total Moves: ${moveCount}`;
    winPopup.classList.remove("hidden");
  }
}

// Controls
resetBtn.addEventListener("click", startGame);
menuBtn.addEventListener("click", () => {
  game.classList.remove("active");
  game.classList.add("hidden");
  menu.classList.add("active");
});
winMain.addEventListener("click", () => {
  winPopup.classList.add("hidden");
  game.classList.add("hidden");
  menu.classList.add("active");
});
