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
  let tiles = [];               // array of { el, correctIndex }
  let moveCount = 0;
  let selectedTile = null;      // reference to tile object (not DOM)
  let currentImage = 1;
  const IMAGE_COUNT = 18;
  const imagePathPrefix = "images/"; // adjust to "./images/" if needed

  // Difficulty buttons
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

  // Start flow: countdown -> preview -> puzzle
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

        setTimeout(() => {
          overlay.classList.add("hidden");
          previewBox.classList.add("hidden");
          startPuzzle();
        }, 3000);
      }
    }, 1000);
  });

 function startPuzzle() {
  // Hide overlays completely and bring game to front
  overlay.classList.add("hidden");
  previewBox.classList.add("hidden");

  game.classList.add("active");
  game.style.zIndex = "5"; // ensure above any fall.js canvas

  // Build puzzle
  puzzle.innerHTML = "";
  puzzle.style.display = "grid";
  puzzle.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  puzzle.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
  puzzle.style.gap = "6px";

  moveCount = 0;
  selectedTile = null;
  updateMoves();
  buildTiles();
  shuffleTiles();
  renderTiles();
}

  // Build tiles in correct order (correctIndex = target position)
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
      // Keep the original/correct index on the object
      tiles.push({ el, correctIndex: i });
    }
  }

  // Fisher-Yates
  function shuffleTiles() {
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
  }

  // Render: always reset event handlers using el.onclick (no duplicates)
  function renderTiles() {
    puzzle.style.display = "grid";
    puzzle.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    puzzle.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    puzzle.style.gap = "6px";
    puzzle.innerHTML = "";

    tiles.forEach((tileObj, index) => {
      const el = tileObj.el;
      el.classList.remove("selected");
      // Important: overwrite any previous click handler (prevents stacking)
      el.onclick = () => onTileClicked(index);
      puzzle.appendChild(el);
    });
  }

  // Click handler (swap mode): click one tile, then another -> swap them
  function onTileClicked(index) {
    const clicked = tiles[index];
    if (!clicked) return;

    // If nothing selected: select this tile
    if (selectedTile === null) {
      selectedTile = clicked;
      clicked.el.classList.add("selected");
      return;
    }

    // If same tile clicked again -> deselect
    if (selectedTile === clicked) {
      selectedTile.el.classList.remove("selected");
      selectedTile = null;
      return;
    }

    // Swap two tile objects inside tiles array
    const firstIndex = tiles.indexOf(selectedTile);
    const secondIndex = index;

    if (firstIndex === -1 || secondIndex === -1) {
      // safety
      selectedTile.el.classList.remove("selected");
      selectedTile = null;
      return;
    }

    // perform swap
    [tiles[firstIndex], tiles[secondIndex]] = [tiles[secondIndex], tiles[firstIndex]];

    // one atomic move
    moveCount += 1;
    updateMoves();

    // clear selection and re-render once (so only single handler runs)
    selectedTile.el.classList.remove("selected");
    selectedTile = null;
    renderTiles();

    // check win
    if (checkWin()) {
      showWin();
    }
  }

  function updateMoves() {
    movesDisplay.textContent = `Moves: ${moveCount}`;
  }

  // Win check: every tile object's correctIndex must equal its current slot index
  function checkWin() {
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i].correctIndex !== i) return false;
    }
    return true;
  }

  function showWin() {
    winPopup.classList.remove("hidden");
    winText.textContent = `🎉 You solved it in ${moveCount} moves!`;
    winImg.src = `${imagePathPrefix}img${currentImage}.png`;
  }

  // Buttons
  resetBtn.addEventListener("click", () => {
    // reshuffle and reset moves
    moveCount = 0;
    selectedTile = null;
    updateMoves();
    buildTiles();
    shuffleTiles();
    renderTiles();
  });

  menuBtn.addEventListener("click", () => {
    // hide game, show menu, reset selection
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
   // pick a new random image for replay
   pickRandomImage();
   moveCount = 0;
   selectedTile = null;
   updateMoves();
   buildTiles();
   shuffleTiles();
   renderTiles();
 });

});



