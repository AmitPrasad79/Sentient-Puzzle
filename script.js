const menu = document.getElementById("menu");
const countdown = document.getElementById("countdown");
const countNum = document.getElementById("count-num");
const game = document.getElementById("game");
const puzzle = document.getElementById("puzzle");
const winPopup = document.getElementById("win");
const startBtn = document.getElementById("start-btn");
const movesDisplay = document.getElementById("moves");
const finalMoves = document.getElementById("final-moves");

let gridSize = 3;
let tiles = [];
let emptyIndex = null;
let moveCount = 0;

document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    gridSize = parseInt(btn.dataset.size);
    startBtn.disabled = false;
  });
});

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
  game.classList.remove("hidden");
  puzzle.innerHTML = "";
  moveCount = 0;
  updateMoves();

  const total = gridSize * gridSize + 1;
  puzzle.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  puzzle.style.gridTemplateRows = `repeat(${Math.ceil(total / gridSize)}, 1fr)`;

  tiles = [];
  const imgIndex = Math.floor(Math.random() * 3) + 1; // images/img1.jpg etc.

  for (let i = 0; i < total; i++) {
    const div = document.createElement("div");
    div.classList.add("tile");

    if (i === total - 1) {
      div.classList.add("empty");
      emptyIndex = i;
    } else {
      div.style.backgroundImage = `url('images/img${imgIndex}.jpg')`;
      const x = i % gridSize;
      const y = Math.floor(i / gridSize);
      div.style.backgroundSize = `${gridSize * 100}% auto`;
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
  const cols = gridSize;
  const rows = Math.ceil((gridSize * gridSize + 1) / cols);
  const row = Math.floor(emptyIndex / cols);
  const col = emptyIndex % cols;
  const moves = [];
  if (row > 0) moves.push(emptyIndex - cols);
  if (row < rows - 1) moves.push(emptyIndex + cols);
  if (col > 0) moves.push(emptyIndex - 1);
  if (col < cols - 1) moves.push(emptyIndex + 1);
  return moves.filter(i => tiles[i] && !tiles[i].classList.contains("empty"));
}

function tryMove(i) {
  if (getMovableTiles().includes(i)) {
    swapTiles(i);
    moveCount++;
    updateMoves();
    checkWin();
  }
}

function swapTiles(i) {
  [tiles[i], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[i]];
  puzzle.innerHTML = "";
  tiles.forEach(t => puzzle.appendChild(t));
  emptyIndex = i;
}

function updateMoves() {
  movesDisplay.textContent = `Moves: ${moveCount}`;
}

function checkWin() {
  let correct = true;
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i].classList.contains("empty")) continue;
  }
  if (correct) {
    winPopup.classList.remove("hidden");
    finalMoves.textContent = `You solved it in ${moveCount} moves 🎉`;
  }
}
