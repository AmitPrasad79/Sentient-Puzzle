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
  let tiles = [];
  let moveCount = 0;
  let selected = null;
  let currentImage = 1;
  const IMAGE_COUNT = 18;

  // select mode
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gridSize = parseInt(btn.dataset.size, 10);
      startBtn.disabled = false;
    });
  });

  function pickRandomImage() {
    currentImage = Math.floor(Math.random() * IMAGE_COUNT) + 1;
  }

  // Start game flow
  startBtn.addEventListener('click', () => {
    pickRandomImage();
    menu.classList.remove('active');   // hide menu properly
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
        countdownBox.classList.add('hidden');
        previewBox.classList.remove('hidden');
        previewImg.src = `images/img${currentImage}.png`;
        previewImg.onload = () => {
          setTimeout(() => {
            overlay.classList.add('hidden');
            previewBox.classList.add('hidden');
            startPuzzle();
          }, 3000);
        };
        previewImg.onerror = () => {
          setTimeout(() => {
            overlay.classList.add('hidden');
            previewBox.classList.add('hidden');
            startPuzzle();
          }, 3000);
        };
      }
    }, 1000);
  });

  function startPuzzle() {
    game.classList.remove('hidden');
    selected = null;
    moveCount = 0;
    updateMoves();
    buildTiles();
    shuffleTiles();
    renderTiles();
  }

  // build grid tiles
  function buildTiles() {
    tiles = [];
    const total = gridSize * gridSize;
    puzzle.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    puzzle.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

    for (let i = 0; i < total; i++) {
      const el = document.createElement('div');
      el.className = 'tile';
      el.dataset.correct = i;

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
      t.el.dataset.position = idx;
      puzzle.appendChild(t.el);
    });
  }

  function shuffleTiles() {
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
  }

  function onTileClick(pos) {
    const currentPos = Array.from(puzzle.children).findIndex(
      el => parseInt(el.dataset.position) === pos
    );

    if (selected === null) {
      selected = currentPos;
      tiles[selected].el.classList.add('selected');
    } else if (selected === currentPos) {
      tiles[selected].el.classList.remove('selected');
      selected = null;
    } else {
      if (isAdjacent(selected, currentPos)) {
        [tiles[selected], tiles[currentPos]] = [tiles[currentPos], tiles[selected]];
        renderTiles();
        moveCount++;
        updateMoves();
        selected = null;
        if (checkWin()) showWin();
      } else {
        tiles[selected].el.classList.remove('selected');
        selected = currentPos;
        tiles[selected].el.classList.add('selected');
      }
    }
  }

  function isAdjacent(a, b) {
    const ax = a % gridSize, ay = Math.floor(a / gridSize);
    const bx = b % gridSize, by = Math.floor(b / gridSize);
    return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
  }

  function updateMoves() {
    movesDisplay.textContent = `Moves: ${moveCount}`;
  }

  function checkWin() {
    return tiles.every((t, idx) => t.correctIndex === idx);
  }

  function showWin() {
    winText.textContent = `You solved it in ${moveCount} moves!`;
    winImg.src = `images/img${currentImage}.png`;
    winPopup.classList.remove('hidden');
  }

  resetBtn.addEventListener('click', startPuzzle);
  menuBtn.addEventListener('click', () => {
    game.classList.add('hidden');
    menu.classList.add('active');
    startBtn.disabled = true;
    modeBtns.forEach(b => b.classList.remove('active'));
  });

  winMain.addEventListener('click', () => {
    winPopup.classList.add('hidden');
    game.classList.add('hidden');
    menu.classList.add('active');
  });

  winRestart.addEventListener('click', () => {
    winPopup.classList.add('hidden');
    pickRandomImage();
    startPuzzle();
  });
});
