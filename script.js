document.addEventListener("DOMContentLoaded", () => {
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

  let gridSize = 3;
  let tiles = [];
  let moveCount = 0;
  let selectedTile = null;
  let currentImage = 1;
  const IMAGE_COUNT = 18;
  const imagePathPrefix = "./images/"; // ✅ ensure correct relative path

  // ---------------------------
  // Difficulty buttons
  // ---------------------------
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      gridSize = parseInt(btn.dataset.size, 10);
      startBtn.disabled = false;
    });
  });

  function pickRandomImage() {
    currentImage = Math.floor(Math.random() * IMAGE_COUNT) + 1;
  }

  // ---------------------------
  // Start flow: countdown → preview → puzzle
  // ---------------------------
  startBtn.addEventListener("click", () => {
    pickRandomImage();

    overlay.classList.remove("hidden");
    countdownBox.classList.remove("hidden");
    previewBox.classList.add("hidden");
    menu.classList.remove("active");

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

        // Wait 3 seconds for preview
        setTimeout(() => {
          // ✅ Build the puzzle FIRST
          buildTiles();
          shuffleTiles();
          renderTiles();

          // ✅ Ensure grid layout is ready before showing
          puzzle.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
          puzzle.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
          puzzle.style.display = "grid";

          // ✅ Bring puzzle up front and ensure repaint
          game.classList.add("active");
          game.style.zIndex = "5";

          // ✅ Force a browser repaint (fix Chrome bug)
          puzzle.offsetHeight;

          // ✅ Wait one frame before hiding overlay
          requestAnimationFrame(() => {
            setTimeout(() => {
              overlay.classList.add("hidden");
              previewBox.classList.add("hidden");
            }, 300);
          });
        }, 3000);
      }
    }, 1000);
  });

  // ---------------------------
  // Reusable puzzle start (for restart)
  // ---------------------------
  function startPuzzle() {
    game.classList.add("active");
    game.style.zIndex = "5";
    overlay.classList.add("hidden");
    previewBox.classList.add("hidden");

    moveCount = 0;
    selectedTile = null;
    updateMoves();

    buildTiles();
    shuffleTiles();
    renderTiles();
  }

  // ---------------------------
  // Tile generation
  // ---------------------------
  function buildTiles() {
    tiles = [];
    const total = gridSize * gridSize;
    for (let i = 0; i < total; i++) {
      const el = document.createElement("div");
      el.className = "tile";
      const x = i % gridSize;
      const y = Math.floor(i / gridSize);
      el.style.backgroundImage = `url('${imagePathPrefix}img${currentImage}.png')`;
      el.style.backgroundSize = `${gridSize * 100}% ${gridSize * 100}%`;
      el.style.backgroundPosition = `${(x / (gridSize - 1)) * 100}% ${(y / (gridSize - 1)) * 100}%`;
      tiles.push({ el, correctIndex: i });
    }
  }

  // ---------------------------
  // Shuffle (Fisher–Yates)
  // ---------------------------
  function shuffleTiles() {
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
  }

  // ---------------------------
  // Render puzzle
  // ---------------------------
  function renderTiles() {
    puzzle.style.display = "grid";
    puzzle.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    puzzle.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    puzzle.style.gap = "6px";
    puzzle.innerHTML = "";

    tiles.forEach((tileObj, index) => {
      const el = tileObj.el;
      el.classList.remove("selected");
      el.onclick = () => onTileClicked(index);
      puzzle.appendChild(el);
    });
  }

  // ---------------------------
  // Tile click handler
  // ---------------------------
  function onTileClicked(index) {
    const clicked = tiles[index];
    if (!clicked) return;

    if (selectedTile === null) {
      selectedTile = clicked;
      clicked.el.classList.add("selected");
      return;
    }

    if (selectedTile === clicked) {
      selectedTile.el.classList.remove("selected");
      selectedTile = null;
      return;
    }

    const firstIndex = tiles.indexOf(selectedTile);
    const secondIndex = index;

    if (firstIndex === -1 || secondIndex === -1) {
      selectedTile.el.classList.remove("selected");
      selectedTile = null;
      return;
    }

    [tiles[firstIndex], tiles[secondIndex]] = [tiles[secondIndex], tiles[firstIndex]];

    moveCount++;
    updateMoves();

    selectedTile.el.classList.remove("selected");
    selectedTile = null;
    renderTiles();

    if (checkWin()) showWin();
  }

  function updateMoves() {
    movesDisplay.textContent = `Moves: ${moveCount}`;
  }

  function checkWin() {
    return tiles.every((tile, i) => tile.correctIndex === i);
  }

  function showWin() {
    winPopup.classList.remove("hidden");
    winText.textContent = `🎉 You solved it in ${moveCount} moves!`;
    winImg.src = `${imagePathPrefix}img${currentImage}.png`;
  }

  // ---------------------------
  // Button handlers
  // ---------------------------
  resetBtn.addEventListener("click", () => {
    moveCount = 0;
    selectedTile = null;
    updateMoves();
    buildTiles();
    shuffleTiles();
    renderTiles();
  });

  menuBtn.addEventListener("click", () => {
    game.classList.remove("active");
    menu.classList.add("active");
    selectedTile = null;
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
    pickRandomImage();
    moveCount = 0;
    selectedTile = null;
    updateMoves();
    buildTiles();
    shuffleTiles();
    renderTiles();
  });
});

