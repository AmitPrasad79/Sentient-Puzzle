const menu = document.getElementById("menu");
const overlay = document.getElementById("overlay");
const game = document.getElementById("game");
const puzzle = document.getElementById("puzzle");
const previewImg = document.getElementById("preview-img");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const menuBtn = document.getElementById("menu-btn");

let gridSize = 3;
let tiles = [];
let emptyIndex;
let imgIndex = 1;

// Mode selection
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
  menu.classList.remove("active");
  overlay.classList.remove("hidden");

  previewImg.src = `images/img${imgIndex}.png`;

  previewImg.onload = () => {
    setTimeout(() => {
      overlay.classList.add("hidden");
      game.classList.remove("hidden");
      startGame();
    }, 2000);
  };
});

function startGame() {
  puzzle.innerHTML = "";
  tiles = [];

  puzzle.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  puzzle.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

  for (let i = 0; i < gridSize * gridSize; i++) {
    const div = document.createElement("div");
    div.classList.add("tile");

    if (i === gridSize * gridSize - 1) {
      div.classList.add("empty");
      emptyIndex = i;
    } else {
      const x = i % gridSize;
      const y = Math.floor(i / gridSize);
      div.style.backgroundImage = `url(images/img${imgIndex}.png)`;
      div.style.backgroundSize = `${gridSize * 100}% ${gridSize * 100}%`;
      div.style.backgroundPosition = `${(x / (gridSize - 1)) * 100}% ${(y / (gridSize - 1)) * 100}%`;
      div.addEventListener("click", () => tryMove(i));
    }

    tiles.push(div);
    puzzle.appendChild(div);
  }

  shuffleTiles();
}

function shuffleTiles() {
  for (let i = 0; i < 100; i++) {
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
  if (row < gridSize - 1) moves.push(emptyIndex + gridSize);
  if (col > 0) moves.push(emptyIndex - 1);
  if (col < gridSize - 1) moves.push(emptyIndex + 1);

  return moves;
}

function tryMove(i) {
  const moves = getMovableTiles();
  if (moves.includes(i)) swapTiles(i);
}

function swapTiles(i) {
  [tiles[i], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[i]];
  puzzle.innerHTML = "";
  tiles.forEach((t) => puzzle.appendChild(t));
  emptyIndex = i;
}

// Reset and menu
resetBtn.addEventListener("click", startGame);
menuBtn.addEventListener("click", () => {
  game.classList.add("hidden");
  menu.classList.add("active");
});
