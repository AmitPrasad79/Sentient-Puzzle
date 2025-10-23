document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const menu = document.getElementById("menu");
  const startBtn = document.getElementById("start-btn");
  const modeBtns = document.querySelectorAll(".mode-btn");
  const overlay = document.getElementById("overlay");
  const countdownBox = document.getElementById("countdown");
  const countNum = document.getElementById("count-num");
  const previewBox = document.getElementById("preview");
  const previewImg = document.getElementById("preview-img");
  const game = document.getElementById("game");
  const puzzle = document.getElementById("puzzle");
  const movesDisplay = document.getElementById("moves");
  const resetBtn = document.getElementById("reset-btn");
  const menuBtn = document.getElementById("menu-btn");
  const winPopup = document.getElementById("win");
  const winText = document.getElementById("win-text");
  const winImg = document.getElementById("win-img");
  const winMain = document.getElementById("win-main");
  const winRestart = document.getElementById("win-restart");

  // State
  let gridSize = 3;
  let tiles = [];
  let moveCount = 0;
  let selected = null;
  let currentImage = 1;
  const IMAGE_COUNT = 18;
  const imagePathPrefix = "images/";

  // Select difficulty
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      gridSize = parseInt(btn.dataset.size);
      startBtn.disabled = false;
    });
  });

  // Pick random image
  function pickRandomImage() {
    currentImage = Math.floor(Math.random() * IMAGE_COUNT) + 1;
  }

  // Start button
  startBtn.addEventListener("click", () => {
    pickRandomImage();
    menu.classList.remove("active");
    overlay.classList.remove("hidden");
    countdownBox.classList.remove("hidden");
    previewBox.classList.add("hidden");

    let count = 3;
    countNum.textContent = count;

    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        countNum.textContent = count;
      } else {
        clearInterval(timer);
        countdownBox.classList.add("hidden");
        previewBox.classList.remove("hidden");
        previewImg.src = `${imagePathPrefix}img${currentImage}.png`;

        // Show preview 3s then start puzzle
        setTimeout(() => {
          overlay.classList.add("hidden");
          previewBox.classList.add("hidden");
          startPuzzle();
        }, 3000);
      }
    }, 1000);
  });

  // Create puzzle
  function startPuzzle() {
    game.classList.add("active");
    puzzle.innerHTML = "";
    moveCount = 0;
    updateMoves();

    buildTiles();
    shuffleTiles();
    renderTiles();
  }

  function buildTiles() {
    tiles = [];
    const total = gridSize * gridSize;
    puzzle.style.display = "grid";
    puzzle.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    puzzle.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    puzzle.style.gap = "6px";

    for (let i = 0; i < total; i++) {
      const div = document.createElement("div");
      div.classList.add("tile");
      div.dataset.correct = i;

      const x = i % gridSize;
      const y = Math.floor(i / gridSize);
      div.style.backgroundImage = `url('${imagePathPrefix}img${currentImage}.png')`;
      div.style.backgroundSize = `${gridSize * 100}% ${gridSize * 100}%`;
      div.style.backgroundPosition = `${(x / (gridSize - 1)) * 100}% ${(y / (gridSize - 1)) * 100}%`;

      div.addEventListener("click", () => handleTileClick(i));
      tiles.push({ el: div, correctIndex: i });
    }
  }

  function shuffleTiles() {
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
  }

  function renderTiles() {
    puzzle.innerHTML = "";
    tiles.forEach((tile) => puzzle.appendChild(tile.el));
  }

  // Click handling: swap two tiles (not sliding)
  function handleTileClick(index) {
    if (selected === null) {
      selected = index;
      tiles[selected].el.classList.add("selected");
    } else if (selected === index) {
      tiles[selected].el.classList.remove("selected");
      selected = null;
    } else {
      [tiles[selected], tiles[index]] = [tiles[index], tiles[selected]];
      moveCount++;
      updateMoves();
      renderTiles();
      selected = null;
      if (checkWin()) showWin();
    }
  }

  function updateMoves() {
    movesDisplay.textContent = `Moves: ${moveCount}`;
  }

  function checkWin() {
    return tiles.every((t, i) => t.correctIndex === i);
  }

  function showWin() {
    winPopup.classList.remove("hidden");
    winText.textContent = `🎉 You solved it in ${moveCount} moves!`;
    winImg.src = `${imagePathPrefix}img${currentImage}.png`;
  }

  // Buttons
  resetBtn.addEventListener("click", startPuzzle);
  menuBtn.addEventListener("click", () => {
    game.classList.remove("active");
    menu.classList.add("active");
    startBtn.disabled = true;
    modeBtns.forEach((b) => b.classList.remove("active"));
  });
  winMain.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    game.classList.remove("active");
    menu.classList.add("active");
  });
  winRestart.addEventListener("click", () => {
    winPopup.classList.add("hidden");
    startPuzzle();
  });
});
