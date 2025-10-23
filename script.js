// Modernized & integrated version of the "fifteen" engine
// - Supports: gridSize^2 + 1 tiles (extra tile in bottom area)
// - Smooth sliding, move counter, keyboard, image cycling, win popup
// - Works with the index.html you shared earlier (ids must match)

document.addEventListener("DOMContentLoaded", () => {
  // UI elements (must match your HTML)
  const menu = document.getElementById("menu");
  const startBtn = document.getElementById("start-btn");
  const overlay = document.getElementById("overlay"); // optional preview overlay
  const previewImg = document.getElementById("preview-img");
  const countdownScreen = document.getElementById("countdown"); // optional countdown section
  const countNum = document.getElementById("count-num"); // optional
  const game = document.getElementById("game");
  const puzzle = document.getElementById("puzzle");
  const resetBtn = document.getElementById("reset-btn");
  const menuBtn = document.getElementById("menu-btn");
  const winPopup = document.getElementById("win");
  const winMain = document.getElementById("win-main");
  const movesDisplay = document.getElementById("moves");

  // Config
  const IMAGE_COUNT = 18;          // number of images available in /images/img1.png ... imgN.png
  let imageIndex = 1;

  // State
  let gridSize = 3;                // selected grid size (3,4,5)
  let totalSlots = () => gridSize * gridSize + 1; // requested behavior
  let cols = () => gridSize;
  let rows = () => Math.ceil(totalSlots() / cols());
  let boardMatrix = [];            // 2D matrix (rows x cols) with tile numbers (0 for blank / empty cell)
  let freeSlot = { r: 0, c: 0 };   // coordinates of the blank within the matrix
  let moves = 0;
  let animating = false;

  // CSS timing
  const SLIDE_MS = 220;

  // --- helpers --------------------------------------------------------------
  function posIndex(r, c) { return r * cols() + c; }
  function inBounds(r, c) { return r >= 0 && r < rows() && c >= 0 && c < cols(); }

  // Map linear tile number -> correct background position (based on gridSize x gridSize slice)
  function backgroundPositionForTile(tileNum) {
    // tileNum is 1..(gridSize*gridSize) mapping into grid-sized slices
    const sliceCols = gridSize;
    const sliceRows = gridSize;
    const idx = tileNum - 1;
    const sx = idx % sliceCols;
    const sy = Math.floor(idx / sliceCols);
    const px = (sx / (sliceCols - 1)) * 100;
    const py = (sy / (sliceRows - 1)) * 100;
    return `${px}% ${py}%`;
  }

  // --- build DOM matrix and tiles ------------------------------------------
  function buildEmptyMatrix() {
    const R = rows(), C = cols();
    boardMatrix = Array.from({length: R}, () => Array(C).fill(null));
  }

  function createTilesDom() {
    puzzle.innerHTML = "";
    const R = rows(), C = cols();
    // Determine cell size from puzzle computed layout
    // Puzzle container CSS should set width/height (we read it)
    const rect = puzzle.getBoundingClientRect();
    const cellW = Math.floor(rect.width / C);
    const cellH = Math.floor(rect.height / R);

    // create tiles for tile numbers 1..(gridSize*gridSize) and one extra blank (0)
    const tileCount = gridSize * gridSize; // number of image pieces
    let created = 0;
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const indexLinear = r * C + c;
        const slotIndex = indexLinear + 1; // 1-based counter for placement
        // Only create up to totalSlots(); rest of cells remain empty placeholders
        if (indexLinear < totalSlots()) {
          // compute the tile number that should sit at this position in solved order
          // We'll fill matrix with numbers 1..tileCount, and the last position becomes blank (0)
          const solvedNumber = (created < tileCount) ? (created + 1) : 0;
          boardMatrix[r][c] = solvedNumber;
          const tileEl = document.createElement("div");
          tileEl.className = "slot-tile";
          tileEl.dataset.r = r;
          tileEl.dataset.c = c;
          tileEl.style.position = "absolute";
          tileEl.style.width = cellW + "px";
          tileEl.style.height = cellH + "px";
          tileEl.style.left = (c * cellW) + "px";
          tileEl.style.top = (r * cellH) + "px";
          tileEl.style.transition = `left ${SLIDE_MS}ms ease, top ${SLIDE_MS}ms ease`;
          tileEl.style.boxSizing = "border-box";
          tileEl.style.borderRadius = "6px";
          tileEl.style.overflow = "hidden";

          if (solvedNumber === 0) {
            tileEl.classList.add("empty-tile");
            freeSlot = { r, c };
            tileEl.setAttribute("aria-hidden", "true");
          } else {
            tileEl.classList.add("puzzle-tile");
            tileEl.textContent = ""; // if you want numbers, put solvedNumber here
            tileEl.style.backgroundImage = `url(images/img${imageIndex}.png)`;
            // use gridSize x gridSize slicing for the image cropping (even if layout has extra bottom row)
            tileEl.style.backgroundSize = `${gridSize * 100}% ${gridSize * 100}%`;
            tileEl.style.backgroundPosition = backgroundPositionForTile(solvedNumber);
            tileEl.style.cursor = "pointer";
            // click handler
            tileEl.addEventListener("click", () => onTileClick(r, c));
          }

          puzzle.appendChild(tileEl);
          created++;
        } else {
          // mark as null (no tile element)
          boardMatrix[r][c] = null;
        }
      }
    }
  }

  function rebuildBoard() {
    // Build matrix size and DOM tiles
    buildEmptyMatrix();
    createTilesDom();
    moves = 0;
    updateMovesUI();
  }

  // --- shuffle by making legal moves (guaranteed solvable) -----------------
  function shuffleBoard(movesToDo = gridSize * gridSize * 12) {
    let count = 0;
    let last = null;
    const interval = setInterval(() => {
      const options = getMovablePositions();
      // avoid undo (prefer other)
      let pick;
      if (options.length > 1) {
        do { pick = options[Math.floor(Math.random() * options.length)]; } while (pick.r === last?.r && pick.c === last?.c);
      } else {
        pick = options[0];
      }
      performSwap(pick.r, pick.c, false); // instant swap (no animate) while shuffling
      last = { r: pick.r, c: pick.c };
      count++;
      if (count >= movesToDo) {
        clearInterval(interval);
        // re-enable transitions on tile elements
        document.querySelectorAll(".slot-tile").forEach(el => el.style.transition = `left ${SLIDE_MS}ms ease, top ${SLIDE_MS}ms ease`);
      }
    }, 4);
  }

  // --- movable logic -------------------------------------------------------
  function getMovablePositions() {
    // return list of {r,c} tiles that can move into the blank by sliding (in same row/col)
    const list = [];
    for (let r = 0; r < rows(); r++) {
      for (let c = 0; c < cols(); c++) {
        // valid tile (not null) and tile is linear-adjacent by row/col path to freeSlot (in same row or same column)
        if (boardMatrix[r][c] === null) continue;
        const dr = Math.abs(r - freeSlot.r), dc = Math.abs(c - freeSlot.c);
        // allow move if same row or same column AND path between tile and free slot contains no null placeholders
        if ((dr === 0 && dc > 0 && pathClearRow(r, c, freeSlot.c)) ||
            (dc === 0 && dr > 0 && pathClearCol(c, r, freeSlot.r))) {
          list.push({ r, c });
        }
      }
    }
    return list;
  }

  function pathClearRow(r, c1, c2) {
    // check from c1 towards c2 (exclusive) that each cell exists (not null)
    const step = c2 > c1 ? 1 : -1;
    for (let c = c1 + step; c !== c2 + step; c += step) {
      // if target position is the freeSlot, it's fine even if its matrix value is 0
      if (!inBounds(r, c) || (boardMatrix[r][c] === null && !(r === freeSlot.r && c === freeSlot.c))) return false;
    }
    return true;
  }

  function pathClearCol(c, r1, r2) {
    const step = r2 > r1 ? 1 : -1;
    for (let r = r1 + step; r !== r2 + step; r += step) {
      if (!inBounds(r, c) || (boardMatrix[r][c] === null && !(r === freeSlot.r && c === freeSlot.c))) return false;
    }
    return true;
  }

  // --- move / slide behaviour ---------------------------------------------
  function onTileClick(r, c) {
    if (animating) return;
    // is (r,c) movable?
    const candidates = getMovablePositions().some(p => p.r === r && p.c === c);
    if (!candidates) return;
    // move potentially multiple tiles in that line toward blank
    slideLineToBlank(r, c);
    moves++;
    updateMovesUI();
  }

  function slideLineToBlank(r, c) {
    const isSameRow = (r === freeSlot.r);
    const isSameCol = (c === freeSlot.c);
    if (!isSameRow && !isSameCol) return;

    // We will shift tiles between (r,c) and freeSlot toward freeSlot.
    // Collect coordinates to move in order (from clicked tile toward blank)
    const coords = [];
    if (isSameRow) {
      const step = freeSlot.c > c ? 1 : -1;
      for (let cc = c; cc !== freeSlot.c + step; cc += step) coords.push({ r, c: cc });
    } else {
      const step = freeSlot.r > r ? 1 : -1;
      for (let rr = r; rr !== freeSlot.r + step; rr += step) coords.push({ r: rr, c });
    }

    // Animate tiles one by one (but we can trigger all CSS transitions simultaneously)
    animating = true;
    // ensure transitions defined
    document.querySelectorAll(".slot-tile").forEach(el => el.style.transition = `left ${SLIDE_MS}ms ease, top ${SLIDE_MS}ms ease`);

    // For proper animation, update DOM positions (left/top) then update model once animation ends.
    // We'll move all tile DOM elements by setting their style left/top to the target positions.
    coords.forEach((coord, idx) => {
      const el = findTileElementAt(coord.r, coord.c);
      if (!el) return;
      // compute target pos = freeSlot position for the first tile, for subsequent tiles it becomes previous tile's position
      let targetR, targetC;
      if (idx === coords.length - 1) { // last element in coords is the blank position, skip
        // do nothing
      } else {
        // target is coords[idx + 1]
        targetR = coords[idx + 1].r;
        targetC = coords[idx + 1].c;
        moveDomTileTo(el, targetR, targetC);
      }
    });

    // After the CSS transition time, update the boardMatrix model and DOM attributes
    setTimeout(() => {
      // rotate values in boardMatrix along the coords path so blank moves to clicked tile position
      const values = coords.map(p => boardMatrix[p.r][p.c]);
      // shift forward: e.g. [A,B,C,0] -> [0,A,B,C] (where last element is 0)
      const shifted = [0].concat(values.slice(0, values.length - 1));
      coords.forEach((p, i) => boardMatrix[p.r][p.c] = shifted[i]);
      // update freeSlot
      freeSlot = { r, c };
      // rebuild DOM element dataset positions (not recreating DOM nodes)
      updateAllTileDatasetAndPositions();
      animating = false;
      if (checkWin()) onWin();
    }, SLIDE_MS + 8);
  }

  function moveDomTileTo(el, targetR, targetC) {
    const rect = puzzle.getBoundingClientRect();
    const cellW = Math.floor(rect.width / cols());
    const cellH = Math.floor(rect.height / rows());
    el.style.left = (targetC * cellW) + "px";
    el.style.top = (targetR * cellH) + "px";
  }

  function findTileElementAt(r, c) {
    // find a DOM tile whose dataset r/c match given values
    return Array.from(puzzle.children).find(ch => parseInt(ch.dataset.r, 10) === r && parseInt(ch.dataset.c, 10) === c);
  }

  function updateAllTileDatasetAndPositions() {
    const rect = puzzle.getBoundingClientRect();
    const cellW = Math.floor(rect.width / cols());
    const cellH = Math.floor(rect.height / rows());

    // iterate matrix and update dataset/r/c and left/top for existing DOM tiles
    let childIndex = 0;
    for (let r = 0; r < rows(); r++) {
      for (let c = 0; c < cols(); c++) {
        if (r * cols() + c >= totalSlots()) continue; // no tile in placeholder cells
        const el = puzzle.children[childIndex++];
        el.dataset.r = r;
        el.dataset.c = c;
        el.style.left = (c * cellW) + "px";
        el.style.top = (r * cellH) + "px";

        const val = boardMatrix[r][c];
        if (val === 0) {
          el.classList.add("empty-tile");
          el.classList.remove("puzzle-tile");
          el.style.backgroundImage = "";
        } else {
          el.classList.remove("empty-tile");
          el.classList.add("puzzle-tile");
          el.style.backgroundImage = `url(images/img${imageIndex}.png)`;
          el.style.backgroundSize = `${gridSize * 100}% ${gridSize * 100}%`;
          el.style.backgroundPosition = backgroundPositionForTile(val);
        }
      }
    }
  }

  // perform instant swap (used during shuffle) - no animation
  function performSwap(r, c, animate = false) {
    // swap tile at (r,c) with freeSlot
    const val = boardMatrix[r][c];
    boardMatrix[freeSlot.r][freeSlot.c] = val;
    boardMatrix[r][c] = 0;
    const el = findTileElementAt(r, c);
    const elBlank = findTileElementAt(freeSlot.r, freeSlot.c);
    if (!el || !elBlank) {
      // fallback: rebuild
      updateAllTileDatasetAndPositions();
    } else {
      // move DOM immediately
      if (!animate) {
        el.style.transition = "none";
        el.style.left = (freeSlot.c * Math.floor(puzzle.getBoundingClientRect().width / cols())) + "px";
        el.style.top = (freeSlot.r * Math.floor(puzzle.getBoundingClientRect().height / rows())) + "px";
        // swap dataset so findTileElementAt works consistently
        const oldR = el.dataset.r, oldC = el.dataset.c;
        el.dataset.r = freeSlot.r; el.dataset.c = freeSlot.c;
        elBlank.dataset.r = r; elBlank.dataset.c = c;
        // restore transitions
        setTimeout(() => el.style.transition = `left ${SLIDE_MS}ms ease, top ${SLIDE_MS}ms ease`, 0);
      } else {
        // animate path
        el.style.left = (freeSlot.c * Math.floor(puzzle.getBoundingClientRect().width / cols())) + "px";
        el.style.top = (freeSlot.r * Math.floor(puzzle.getBoundingClientRect().height / rows())) + "px";
      }
    }
    freeSlot = { r, c };
  }

  // --- win check ----------------------------------------------------------
  function checkWin() {
    // win when all numbered tiles are in correct positions ignoring placeholders.
    // correct order is 1..(gridSize*gridSize) in row-major (first N cells)
    let expected = 1;
    for (let r = 0; r < rows(); r++) {
      for (let c = 0; c < cols(); c++) {
        if (r * cols() + c >= totalSlots()) continue;
        const val = boardMatrix[r][c];
        if (val === 0) {
          // blank must be the last allocated slot (position totalSlots()-1)
          if ((r * cols() + c) !== (totalSlots() - 1)) return false;
        } else {
          if (val !== expected) return false;
          expected++;
        }
      }
    }
    return true;
  }

  function onWin() {
    // show popup, display moves
    if (winPopup) {
      winPopup.classList.remove("hidden");
      const fm = winPopup.querySelector("#final-moves");
      if (fm) fm.textContent = `Moves: ${moves}`;
    } else {
      alert(`You solved it in ${moves} moves`);
    }
  }

  // --- UI helpers ---------------------------------------------------------
  function updateMovesUI() {
    if (movesDisplay) movesDisplay.textContent = `Moves: ${moves}`;
  }

  // --- keyboard controls --------------------------------------------------
  document.addEventListener("keydown", (ev) => {
    // arrows: move tile into blank in those directions
    if (animating) return;
    const k = ev.keyCode;
    // left(37) means try to move tile to the right of blank into blank (i.e., press left arrow moves blank left)
    if (k === 37) { // left
      const r = freeSlot.r, c = freeSlot.c + 1;
      if (inBounds(r, c) && boardMatrix[r][c] !== null) { onTileClick(r, c); moves++; updateMovesUI(); }
    } else if (k === 38) { // up
      const r = freeSlot.r + 1, c = freeSlot.c;
      if (inBounds(r, c) && boardMatrix[r][c] !== null) { onTileClick(r, c); moves++; updateMovesUI(); }
    } else if (k === 39) { // right
      const r = freeSlot.r, c = freeSlot.c - 1;
      if (inBounds(r, c) && boardMatrix[r][c] !== null) { onTileClick(r, c); moves++; updateMovesUI(); }
    } else if (k === 40) { // down
      const r = freeSlot.r - 1, c = freeSlot.c;
      if (inBounds(r, c) && boardMatrix[r][c] !== null) { onTileClick(r, c); moves++; updateMovesUI(); }
    }
  });

  // --- public flow: start/reset/menu -------------------------------------
  function startRound() {
    // set imageIndex, rebuild board, then shuffle
    imageIndex = imageIndex % IMAGE_COUNT + 1;
    rebuildBoard();
    // After DOM created, shuffle
    shuffleBoard();
    moves = 0;
    updateMovesUI();
  }

  // Attach start button (show preview + countdown then start)
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      // optional preview overlay if previewImg exists
      if (overlay && previewImg) {
        overlay.classList.remove("hidden");
        previewImg.src = `images/img${imageIndex}.png`;
        // show preview 1.2s then 3..2..1 countdown (we replicate requested behavior)
        setTimeout(() => {
          // simple countdown (3->2->1) shown via countNum if available
          if (countdownScreen && countNum) {
            overlay.classList.add("hidden");
            countdownScreen.classList.remove("hidden");
            let c = 3;
            countNum.textContent = c;
            const t = setInterval(() => {
              c--;
              if (c > 0) {
                countNum.textContent = c;
              } else {
                clearInterval(t);
                countdownScreen.classList.add("hidden");
                game.classList.remove("hidden");
                startRound();
              }
            }, 1000);
          } else {
            overlay.classList.add("hidden");
            game.classList.remove("hidden");
            startRound();
          }
        }, 1200);
      } else {
        game.classList.remove("hidden");
        startRound();
      }
    });
  }

  // reset
  if (resetBtn) resetBtn.addEventListener("click", () => {
    startRound();
    if (winPopup) winPopup.classList.add("hidden");
  });

  // menu/back
  if (menuBtn) menuBtn.addEventListener("click", () => {
    game.classList.add("hidden");
    menu.classList.remove("active");
    // return to menu UI (assumes menu visible logic handled elsewhere)
  });

  // win popup back to menu
  if (winMain) winMain.addEventListener("click", () => {
    if (winPopup) winPopup.classList.add("hidden");
    game.classList.add("hidden");
    menu.classList.add("active");
  });

  // Mode selection wiring (if your HTML uses .mode-btn elements)
  document.querySelectorAll(".mode-btn").forEach(b => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".mode-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      const s = parseInt(b.dataset.size, 10);
      if ([3,4,5].includes(s)) gridSize = s;
    });
  });

  // initial small build so CSS sizes applied
  rebuildBoard();
});
