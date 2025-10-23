const menu = document.getElementById("menu");
const countdown = document.getElementById("countdown");
const countNum = document.getElementById("count-num");
const game = document.getElementById("game");
const puzzle = document.getElementById("puzzle");
const puzzleBox = document.getElementById("puzzle-box");
const winPopup = document.getElementById("win");
const winMain = document.getElementById("win-main");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const menuBtn = document.getElementById("menu-btn");
const movesDisplay = document.getElementById("moves");
const finalMoves = document.getElementById("final-moves");

let gridSize = 3;
let tiles = [];
let emptyIndex;
let moveCount = 0;
let imgIndex = 1;

// Load random image index (assuming images/img1.png, img2.png, ...)
function randomImage() {
  imgIndex = Math.floor(Math.random() * 5) + 1; // 5 images
}

// Total tiles: grid^2 + 1 (extra bottom tile)
function totalTiles() {
  return gridSize * gridSize + 1;
}

// Mode selection logic
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    gridSize = parseInt(btn.dataset.size);
    startBtn.disabled = false;
  });
});

// Start button + countdown
startBtn.addEventListener("click", () => {
  menu.classList.add("hidden");
  countdown.classList.remove("hidden");
  let count = 3;
  countNum.textContent = count;

  const timer = setInterval(() => {
    count--;
    if (count > 0) countNum.textContent = count;
    else {
      clearInterval(timer);
      countdown.classList.add("hidden");
      startGame();
    }
  }, 1000);
});

function startGame() {
  randomImage();
  game.classList.remove("hidden");
  puzzle.innerHTML = "";
  puzzleBox.style.border = "4px solid cyan";
  puzzleBox.style.borderRadius = "8px";
  puzzleBox.style.padding = "5px";

  moveCount = 0;
  updateMoves();

  tiles = [];
  const total = totalTiles();
  puzzle.style.display = "grid";
  puzzle.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  puzzle.style.gridTemplateRows = `repeat(${Math.ceil(total / gridSize)}, 1fr)`;

  for (let i = 0; i < total; i++) {
    const div = document.createElement("div");
    div.classList.add("tile");

    if (i === total - 1) {
      div.classList.add("empty");
      emptyIndex = i;
    } else {
      const x = i % gridSize;
      const y = Math.floor(i / gridSize);
      div.style.backgroundImage = `url(images/img${imgIndex}.png)`;
      div.style.backgroundSize = `${gridSize * 100}% ${Math.ceil(total / gridSize) * 100}%`;
      div.style.backgroundPosition = `${(x / (gridSize - 1)) * 100}% ${(y / (Math.ceil(total / gridSize) - 1)) * 100}%`;
      div.addEventListener("click", () => tryMove(i));
    }

    tiles.push(div);
    puzzle.appendChild(div);
  }

  shuffleTiles();
}

function shuffleTiles() {
  for (let i = 0; i < 150; i++) {
    const moves = getMovableTiles();
    const rand = moves[Math.floor(Math.random() * moves.length)];
    swapTiles(rand);
  }
}

function getMovableTiles() {
  const totalCols = gridSize;
  const totalRows = Math.ceil(totalTiles() / gridSize);
  const row = Math.floor(emptyIndex / totalCols);
  const col = emptyIndex % totalCols;
  const moves = [];

  if (row > 0) moves.push(emptyIndex - totalCols);
  if (row < totalRows - 1) moves.push(emptyIndex + totalCols);
  if (col > 0) moves.push(emptyIndex - 1);
  if (col < totalCols - 1) moves.push(emptyIndex + 1);

  return moves.filter((i) => tiles[i] && !tiles[i].classList.contains("empty"));
}

function tryMove(i) {
  const moves = getMovableTiles();
  if (moves.includes(i)) slideTile(i);
}

function slideTile(i) {
  const tile = tiles[i];
  const emptyTile = tiles[emptyIndex];
  const rect1 = tile.getBoundingClientRect();
  const rect2 = emptyTile.getBoundingClientRect();

  tile.style.transition = "transform 0.25s ease";
  tile.style.transform = `translate(${rect2.left - rect1.left}px, ${rect2.top - rect1.top}px)`;

  setTimeout(() => {
    tile.style.transition = "none";
    tile.style.transform = "none";
    swapTiles(i);
    moveCount++;
    updateMoves();
    checkWin();
  }, 250);
}

function swapTiles(i) {
  [tiles[i], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[i]];
  puzzle.innerHTML = "";
  tiles.forEach((t) => puzzle.appendChild(t));
  emptyIndex = i;
}

function updateMoves() {
  movesDisplay.textContent = `Moves: ${moveCount}`;
}

function checkWin() {
  let correct = true;
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i].classList.contains("empty")) continue;
    const correctX = i % gridSize;
    const correctY = Math.floor(i / gridSize);
    const style = tiles[i].style.backgroundPosition.split(" ");
    const x = parseFloat(style[0]);
    const y = parseFloat(style[1]);
    if (Math.abs(x - (correctX / (gridSize - 1)) * 100) > 1 || Math.abs(y - (correctY / (gridSize - 1)) * 100) > 1) {
      correct = false;
      break;
    }
  }
  if (correct) {
    setTimeout(() => {
      winPopup.classList.remove("hidden");
      finalMoves.textContent = `You finished in ${moveCount} moves 🎯`;
    }, 300);
  }
}

// Reset & Menu buttons
resetBtn.addEventListener("click", startGame);
menuBtn.addEventListener("click", () => {
  game.classList.add("hidden");
  menu.classList.remove("hidden");
});
winMain.addEventListener("click", () => {
  winPopup.classList.add("hidden");
  game.classList.add("hidden");
  menu.classList.remove("hidden");
});
