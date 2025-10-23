const menu = document.getElementById("menu");
const game = document.getElementById("game");
const puzzle = document.getElementById("puzzle");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const menuBtn = document.getElementById("menu-btn");
const movesDisplay = document.getElementById("moves");
const winPopup = document.getElementById("win");
const winMain = document.getElementById("win-main");
const finalMoves = document.getElementById("final-moves");

let gridSize = 3;
let tiles = [];
let moveCount = 0;
let selectedTile = null;
let imgIndex = 1;

// Select mode
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    gridSize = parseInt(btn.dataset.size);
    startBtn.disabled = false;
  });
});

// Start Game
startBtn.addEventListener("click", () => {
  menu.classList.remove("active");
  menu.classList.add("hidden");
  game.classList.remove("hidden");
  startGame();
});

// Reset Game
resetBtn.addEventListener("click", startGame);

// Back to Menu
menuBtn.addEventListener("click", () => {
  game.classList.add("hidden");
  menu.classList.remove("hidden");
  menu.classList.add("active");
});

// Win popup → back to menu
winMain.addEventListener("click", () => {
  winPopup.classList.add("hidden");
  game.classList.add("hidden");
  menu.classList.remove("hidden");
  menu.classList.add("active");
});

function startGame() {
  puzzle.innerHTML = "";
  moveCount = 0;
  updateMoves();
  selectedTile = null;
  winPopup.classList.add("hidden");

  // Set grid
  puzzle.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  puzzle.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

  const totalTiles = gridSize * gridSize;
  tiles = [];

  // Pick a random image number from 1-3
  imgIndex = Math.floor(Math.random() * 3) + 1;

  for (let i = 0; i < totalTiles; i++) {
    const div = document.createElement("div");
    div.classList.add("tile");

    const x = i % gridSize;
    const y = Math.floor(i / gridSize);
    div.style.backgroundImage = `url('images/img${imgIndex}.png')`;
    div.style.backgroundSize = `${gridSize * 100}% ${gridSize * 100}%`;
    div.style.backgroundPosition = `${(x / (gridSize - 1)) * 100}% ${(y / (gridSize - 1)) * 100}%`;

    div.dataset.correct = i;
    div.addEventListener("click", () => handleTileClick(i));
    tiles.push(div);
  }

  // Shuffle tiles
  tiles.sort(() => Math.random() - 0.5);
  renderTiles();
}

function renderTiles() {
  puzzle.innerHTML = "";
  tiles.forEach(t => puzzle.appendChild(t));
}

function handleTileClick(i) {
  if (selectedTile === null) {
    selectedTile = i;
    tiles[i].style.boxShadow = "0 0 10px #00e5ff";
  } else if (selectedTile === i) {
    tiles[i].style.boxShadow = "";
    selectedTile = null;
  } else {
    tiles[selectedTile].style.boxShadow = "";
    swapTiles(selectedTile, i);
    selectedTile = null;
    moveCount++;
    updateMoves();
    checkWin();
  }
}

function swapTiles(i, j) {
  [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  renderTiles();
}

function updateMoves() {
  movesDisplay.textContent = `Moves: ${moveCount}`;
}

function checkWin() {
  const isSolved = tiles.every((tile, index) => parseInt(tile.dataset.correct) === index);
  if (isSolved) {
    finalMoves.textContent = `You solved it in ${moveCount} moves!`;
    winPopup.classList.remove("hidden");
  }
}

