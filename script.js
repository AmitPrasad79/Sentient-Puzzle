// Sentient Puzzle Slide+ (swap puzzle, no empty tile)
// Works with images/img1.png ... images/img18.png
document.addEventListener('DOMContentLoaded', () => {
  // DOM refs
  const menu = document.getElementById('menu');
  const startBtn = document.getElementById('start-btn');
  const modeBtns = document.querySelectorAll('.mode-btn');

  const overlay = document.getElementById('overlay');
  const countdownBox = document.getElementById('countdown');
  const countNum = document.getElementById('count-num');
  const previewBox = document.getElementById('preview');
  const previewImg = document.getElementById('preview-img');

  const game = document.getElementById('game');
  const puzzle = document.getElementById('puzzle');
  const puzzleBox = document.getElementById('puzzle-box');
  const resetBtn = document.getElementById('reset-btn');
  const menuBtn = document.getElementById('menu-btn');

  const movesDisplay = document.getElementById('moves');

  const winPopup = document.getElementById('win');
  const winText = document.getElementById('win-text');
  const winImg = document.getElementById('win-img');
  const winMain = document.getElementById('win-main');
  const winRestart = document.getElementById('win-restart');

  // state
  let gridSize = 3;
  let tiles = []; // array of {el, correctIndex}
  let moveCount = 0;
  let selected = null;
  let currentImage = 1;
  const IMAGE_COUNT = 18;

  // enable start once a mode is chosen
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gridSize = parseInt(btn.dataset.size, 10);
      startBtn.disabled = false;
    });
  });

  // helper: pick random image index
  function pickRandomImage() {
    currentImage = Math.floor(Math.random() * IMAGE_COUNT) + 1;
  }

  // Start flow: countdown -> preview -> show puzzle
  startBtn.addEventListener('click', () => {
    // pick image first
    pickRandomImage();
    // show overlay countdown
    overlay.classList.remove('hidden');
    countdownBox.classList.remove('hidden');
    previewBox.classList.add('hidden');
    countNum.textContent = '3';

    let c = 3;
    const ct = setInterval(() => {
      c--;
      if (c > 0) {
        countNum.textContent = String(c);
      } else {
        clearInterval(ct);
        // show preview (full image) for 3s
        countdownBox.classList.add('hidden');
        previewBox.classList.remove('hidden');
        previewImg.src = `images/img${currentImage}.png`;
        // ensure image loads before starting timer
        previewImg.onload = () => {
          setTimeout(() => {
            overlay.classList.add('hidden');
            previewBox.classList.add('hidden');
            beginGame();
          }, 3000);
        };
        // if image fails to load (404), still continue after 3s with fallback color
        previewImg.onerror = () => {
          setTimeout(() => {
            overlay.classList.add('hidden');
            previewBox.classList.add('hidden');
            beginGame();
          }, 3000);
        };
      }
    }, 1000);
  });

  function beginGame() {
    // show game screen
    menu.classList.add('hidden');
    game.classList.remove('hidden');
    winPopup.classList.add('hidden');
    selected = null;
    moveCount = 0;
    updateMoves();

    buildTiles();
    shuffleTiles();
    renderTiles();
  }

  // build tiles in correct order (gridSize x gridSize)
  function buildTiles() {
    tiles = [];
    const total = gridSize * gridSize;
    // set puzzle grid template
    puzzle.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    puzzle.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

    for (let i = 0; i < total; i++) {
      const el = document.createElement('div');
      el.className = 'tile';
      el.dataset.correct = i; // solved position
      // compute background slice
      const x = i % gridSize;
      const y = Math.floor(i / gridSize);
      el.style.backgroundImage = `url('images/img${currentImage}.png')`;
      el.style.backgroundSize = `${gridSize * 100}% ${gridSize * 100}%`;
      el.style.backgroundPosition = `${(x / (gridSize - 1)) * 100}% ${(y / (gridSize - 1)) * 100}%`;
      el.addEventListener('click', () => onTileClick(i));
      tiles.push({ el, correctIndex: i });
    }
  }

  function renderTiles() {
    puzzle.innerHTML = '';
    tiles.forEach((t, idx) => {
      // store current position index on element for adjacency checks
      t.el.dataset.position = idx;
      puzzle.appendChild(t.el);
    });
  }

  // Shuffle: Fisher-Yates on tiles array
  function shuffleTiles() {
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
  }

  // click handler: select or attempt swap
  function onTileClick(positionIndex) {
    // positionIndex is the original index when built — but tiles array order is current layout.
    // We map by dataset.position in render, so find index of clicked tile in tiles array:
    const clickedIndex = parseInt(tiles.findIndex(t => parseInt(t.el.dataset.position, 10) === positionIndex), 10);
    // However simpler: event closure above passed i fixed at build time; after shuffle, dataset.position is correct.
    // So instead, find element by position attribute:
    const el = tiles.find(t => parseInt(t.el.dataset.position, 10) === positionIndex).el;
    const currentPos = Array.prototype.indexOf.call(puzzle.children, el);

    if (selected === null) {
      // select this tile
      selected = currentPos;
      tiles[currentPos].el.classList.add('selected');
    } else if (selected === currentPos) {
      // deselect
      tiles[selected].el.classList.remove('selected');
      selected = null;
    } else {
      // attempt swap if adjacent
      if (isAdjacent(selected, currentPos)) {
        // swap elements in tiles array at indices selected and currentPos
        [tiles[selected], tiles[currentPos]] = [tiles[currentPos], tiles[selected]];
        // re-render
        renderTiles();
        moveCount++;
        updateMoves();
        selected = null;
        // check win
        if (checkWin()) showWin();
      } else {
        // if not adjacent, switch selection to the new tile
        tiles[selected].el.classList.remove('selected');
        selected = currentPos;
        tiles[selected].el.classList.add('selected');
      }
    }
  }

  // adjacency check in the grid (using indices in tiles array => positions on board)
  function isAdjacent(aIndex, bIndex) {
    // compute coordinates row/col for index on current layout: index -> row = floor(index / gridSize)
    const ax = aIndex % gridSize, ay = Math.floor(aIndex / gridSize);
    const bx = bIndex % gridSize, by = Math.floor(bIndex / gridSize);
    const dist = Math.abs(ax - bx) + Math.abs(ay - by);
    return dist === 1; // Manhattan distance 1
  }

  function updateMoves() {
    movesDisplay.textContent = `Moves: ${moveCount}`;
  }

  function checkWin() {
    // solved when for each position idx, the tile at tiles[idx].correctIndex === idx
    return tiles.every((t, idx) => t.correctIndex === idx);
  }

  function showWin() {
    winText.textContent = `You solved it in ${moveCount} moves!`;
    winImg.src = `images/img${currentImage}.png`;
    winPopup.classList.remove('hidden');
  }

  // buttons
  resetBtn.addEventListener('click', () => {
    selected = null;
    moveCount = 0;
    updateMoves();
    buildTiles();
    shuffleTiles();
    renderTiles();
  });

  menuBtn.addEventListener('click', () => {
    // back to menu
    game.classList.add('hidden');
    menu.classList.remove('hidden');
    // reset start button disabled state: only enabled when a mode chosen
    startBtn.disabled = true;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  });

  winMain.addEventListener('click', () => {
    winPopup.classList.add('hidden');
    game.classList.add('hidden');
    menu.classList.remove('hidden');
  });

  winRestart.addEventListener('click', () => {
    winPopup.classList.add('hidden');
    // start another round with same difficulty (pick new image)
    pickRandomImage();
    beginGame();
  });

  // ensure start button keyboard accessibility
  startBtn.addEventListener('keyup', (e) => { if (e.key === 'Enter') startBtn.click(); });

  // small safety: if image files mis
