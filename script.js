const menu = document.getElementById("menu");
const game = document.getElementById("game");
const puzzle = document.getElementById("puzzle");
const startBtn = document.getElementById("start-btn");
const movesDisplay = document.getElementById("moves");
const winPopup = document.getElementById("win");
const finalMoves = document.getElementById("final-moves");

let gridSize = 3;
let tiles = [];
let moveCount = 0;
let selectedTile = null;
let imgIndex = 1;

// Select difficulty
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    gridSize = parseInt(btn.dataset.size);
    startBtn.disabled = false;
  });
});

// Start game
startBtn.addEventListener("click", () => {
  imgIndex = Math.floor(Math.random() * 3) + 1; // random image
  menu.classList.remove("active");
  game.classList.remove("hidden");
  startGame();
});

// Reset game
document.getElementById("reset-btn").addEventListener("click", startGame);

// Return to menu
document.getElementById("menu-btn").addEventListener("click", () => {
  game.classList.add("hidden");
  menu.classList.add("active");
});

document.getElementById("win-main").addEventListener("click", () => {
  winPopup.classList.add("hidden");
  game.classList.add("hidden");
  menu.classList.add("active");
});

function startGame() {
  puzzle.innerHTML = "";
  moveCount = 0;
  updateMoves();
  winPopup.classList.add("hidden");

  puzzle.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  puzzle.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

  const totalTiles = gridSize * gridSize;
  tiles = [];

  for (let i = 0; i < totalTiles; i++) {
    const div = document.createElement("div");
    div.classList.add("tile");

    const x = i % gridSize;
    const y = Math.floor(i / gridSize);
    div.style.backgroundImage = `url('images/img${imgIndex}.jpg')`;
    div.style.backgroundSize = `${gridSize * 100}% ${gridSize * 100}%`;
    div.style.backgroundPosition = `${(x / (gridSize - 1)) * 100}% ${(y / (gridSize - 1)) * 100}%`;

    div.addEventListener("click", () => selectTile(i));
    tiles.push({ element: div, index: i });
    puzzle.appendChild(div);
  }

  shuffleTiles();
}

function shuffleTiles() {
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  puzzle.innerHTML = "";
  tiles.forEach(t => puzzle.appendChild(t.element));
}

function selectTile(i) {
  if (selectedTile === null) {
    selectedTile = i;
    tiles[i].element.style.boxShadow = "0 0 10px #00e5ff";
  } else {
    tiles[selectedTile].element.style.boxShadow = "";
    swapTiles(selectedTile, i);
    selectedTile = null;
    moveCount++;
    updateMoves();
    checkWin();
  }
}

function swapTiles(i, j) {
  [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  puzzle.innerHTML = "";
  tiles.forEach(t => puzzle.appendChild(t.element));
}

function updateMoves() {
  movesDisplay.textContent = `Moves: ${moveCount}`;
}

function checkWin() {
  const isWin = tiles.every((t, i) => t.index === i);
  if (isWin) {
    winPopup.classList.remove("hidden");
    finalMoves.textContent = `You solved it in ${moveCount} moves 🎉`;
  }
}
