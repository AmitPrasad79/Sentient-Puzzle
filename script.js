// Sentient Puzzle Slide+
// ----------------------

const menuScreen = document.getElementById("menu");
const gameScreen = document.getElementById("game");
const overlay = document.getElementById("overlay");
const previewBox = document.getElementById("preview");
const countdownBox = document.getElementById("countdown");
const countNum = document.getElementById("count-num");
const puzzleContainer = document.getElementById("puzzle");
const startBtn = document.getElementById("start-btn");
const moveDisplay = document.getElementById("moves");
const winPopup = document.getElementById("win");
const winImg = document.getElementById("win-img");
const winText = document.getElementById("win-text");
const winMainBtn = document.getElementById("win-main");
const winRestartBtn = document.getElementById("win-restart");
const menuBtn = document.getElementById("menu-btn");
const resetBtn = document.getElementById("reset-btn");

let gridSize = 3;
let moves = 0;
let tiles = [];
let emptyIndex;
let currentImage = 1;

const imagePathPrefix = "./images/";

// ----------------------
// MENU
// ----------------------
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    gridSize = parseInt(btn.dataset.size);
    startBtn.disabled = false;
  });
});

startBtn.addEventListener("click", startGame);

function startGame() {
  menuScreen.classList.remove("active");
  overlay.classList.remove("hidden");
  previewBox.classList.remove("hidden");

  const previewImg = document.getElementById("preview-img");
  previewImg.src = `${imagePathPrefix}img${currentImage}.png`;

  setTimeout(() => {
    previewBox.classList.add("hidden");
    countdownBox.classList.remove("hidden");

    let countdown = 3;
    countNum.textContent = countdown;

    const timer = setInterval(() => {
      countdown--;
      countNum.textContent = countdown;
      if (countdown === 0) {
        clearInterval(timer);
        overlay.classList.add("hidden");
        countdownBox.classList.add("hidden");
        showGame();
      }
    }, 1000);
  }, 3000);
}

// ----------------------
// GAME LOGIC
// ----------------------

function showGame() {
  gameScreen.classList.add("active");
  buildPuzzle();
}

function buildPuzzle() {
  puzzleContainer.innerHTML = "";
  puzzleContainer.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  puzzleContainer.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

  const positions = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      positions.push({ x, y });
    }
  }

  emptyIndex = positions.length - 1;
  tiles = [];

  positions.forEach((pos, i) => {
    const div = document.createElement("div");
    if (i !== emptyIndex) {
      div.className = "tile";
      div.style.backgroundImage = `url(${imagePathPrefix}img${currentImage}.png)`;
      div.style.backgroundSize = `${gridSize * 100}%`;
      div.style.backgroundPosition = `${(pos.x / (gridSize - 1)) * 100}% ${(pos.y / (gridSize - 1)) * 100}%`;
      div.dataset.correctIndex = i;
      div.addEventListener("click", () => moveTile(i));
    }
    puzzleContainer.appendChild(div);
    tiles.push(div);
  });

  shufflePuzzle();
  moves = 0;
  moveDisplay.textContent = `Moves: ${moves}`;
}

function shufflePuzzle() {
  for (let i = 0; i < 300; i++) {
    const neighbors = getNeighbors(emptyIndex);
    const rand = neighbors[Math.floor(Math.random() * neighbors.length)];
    swapTiles(emptyIndex, rand);
    emptyIndex = rand;
  }
}

function getNeighbors(index) {
  const neighbors = [];
  const row = Math.floor(index / gridSize);
  const col = index % gridSize;
  if (row > 0) neighbors.push(index - gridSize);
  if (row < gridSize - 1) neighbors.push(index + gridSize);
  if (col > 0) neighbors.push(index - 1);
  if (col < gridSize - 1) neighbors.push(index + 1);
  return neighbors;
}

function moveTile(index) {
  const neighbors = getNeighbors(emptyIndex);
  if (neighbors.includes(index)) {
    swapTiles(index, emptyIndex);
    emptyIndex = index;
    moves++;
    moveDisplay.textContent = `Moves: ${moves}`;
    checkWin();
  }
}

function swapTiles(i1, i2) {
  const temp = tiles[i1];
  tiles[i1] = tiles[i2];
  tiles[i2] = temp;

  puzzleContainer.innerHTML = "";
  tiles.forEach((tile) => puzzleContainer.appendChild(tile));
}

function checkWin() {
  for (let i = 0; i < tiles.length - 1; i++) {
    if (!tiles[i]) continue;
    if (parseInt(tiles[i].dataset.correctIndex) !== i) return;
  }
  showWin();
}

function showWin() {
  gameScreen.classList.remove("active");
  winPopup.classList.remove("hidden");
  winImg.src = `${imagePathPrefix}img${currentImage}.png`;
  winText.textContent = `You solved it in ${moves} moves!`;
}

// ----------------------
// BUTTONS
// ----------------------

menuBtn.addEventListener("click", () => {
  gameScreen.classList.remove("active");
  menuScreen.classList.add("active");
});

resetBtn.addEventListener("click", buildPuzzle);

winMainBtn.addEventListener("click", () => {
  winPopup.classList.add("hidden");
  menuScreen.classList.add("active");
});

winRestartBtn.addEventListener("click", () => {
  winPopup.classList.add("hidden");
  buildPuzzle();
});
