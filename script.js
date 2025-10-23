// Sentient Puzzle Slide+ — standard N x N sliding puzzle with preview + 3..2..1 countdown
document.addEventListener("DOMContentLoaded", () => {
  // DOM
  const menu = document.getElementById("menu");
  const overlay = document.getElementById("overlay");
  const previewBox = document.getElementById("preview-box");
  const previewImg = document.getElementById("preview-img");
  const countdownEl = document.getElementById("countdown");
  const countNum = document.getElementById("count-num");
  const startBtn = document.getElementById("start-btn");
  const modeBtns = document.querySelectorAll(".mode-btn");
  const game = document.getElementById("game");
  const board = document.getElementById("board");
  const resetBtn = document.getElementById("reset-btn");
  const menuBtn = document.getElementById("menu-btn");
  const winPopup = document.getElementById("win-popup");
  const backBtn = document.getElementById("back-btn");

  // Config
  let gridSize = 3;          // default easy
  const BOARD_PIX = 420;     // board pixel size (CSS)
  const IMAGE_BASE = "images/img1.png"; // replace with your image(s) path if needed

  // State
  let tiles = [];    // array of tile objects {el, x, y, correctX, correctY}
  let blank = {x: gridSize-1, y: gridSize-1};
  let animating = false;

  // mode buttons
  modeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      gridSize = parseInt(btn.dataset.size, 10);
      startBtn.disabled = false;
    });
  });

  // Start button -> show preview then countdown to 3
  startBtn.addEventListener("click", () => {
    // show preview box overlay
    previewImg.src = IMAGE_BASE;
    overlay.classList.remove("hidden");
    previewBox.classList.remove("hidden");
    countdownEl.classList.add("hidden");

    // show preview for 2 seconds then run 3..2..1 countdown
    previewImg.onload = () => {
      setTimeout(() => runCountdownAndStart(), 1000); // short preview then countdown (user requested immediate count)
    };
  });

  function runCountdownAndStart(){
    previewBox.classList.add("hidden");
    countdownEl.classList.remove("hidden");
    let count = 3;
    countNum.textContent = count;
    const t = setInterval(() => {
      count--;
      countNum.textContent = count;
      if(count === 0){
        clearInterval(t);
        countdownEl.classList.add("hidden");
        overlay.classList.add("hidden");
        openGame();
      }
    }, 1000);
  }

  function openGame(){
    menu.classList.add("hidden");
    game.classList.remove("hidden");
    buildBoard();
    shuffleBoard();
  }

  // Build tile DOM objects and positions
  function buildBoard(){
    // reset
    tiles.forEach(t => t.el.remove());
    tiles = [];
    board.innerHTML = "";
    board.style.width = BOARD_PIX + "px";
    board.style.height = BOARD_PIX + "px";

    // position size for each tile
    const tileSize = Math.floor(BOARD_PIX / gridSize);
    const tilePixel = tileSize; // square

    // create tiles for 0 .. gridSize*gridSize-1 ; last tile is blank
    for(let y=0;y<gridSize;y++){
      for(let x=0;x<gridSize;x++){
        const index = y*gridSize + x;
        const isBlank = (x === gridSize-1 && y === gridSize-1);
        const div = document.createElement("div");
        div.className = "tile";
        div.style.width = tilePixel + "px";
        div.style.height = tilePixel + "px";
        // absolute placement by left/top
        div.style.left = (x * tilePixel) + "px";
        div.style.top = (y * tilePixel) + "px";

        if(isBlank){
          div.classList.add("empty");
        } else {
          // background cropping: calculate percent positions
          div.style.backgroundImage = `url('${IMAGE_BASE}')`;
          div.style.backgroundSize = `${gridSize * 100}% ${gridSize * 100}%`;
          const posX = (x / (gridSize - 1)) * 100;
          const posY = (y / (gridSize - 1)) * 100;
          div.style.backgroundPosition = `${posX}% ${posY}%`;
          div.addEventListener("click", () => trySlide(x,y));
        }

        board.appendChild(div);
        tiles.push({el:div, x, y, correctX:x, correctY:y});
      }
    }
    blank = {x: gridSize-1, y: gridSize-1};
  }

  // Get tile object by coordinate
  function tileAt(x,y){
    return tiles.find(t => t.x === x && t.y === y);
  }

  // Check movable (Manhattan distance 1)
  function isAdjacent(x,y, bx, by){
    const d = Math.abs(x - bx) + Math.abs(y - by);
    return d === 1;
  }

  // Try sliding a tile into blank
  function trySlide(x,y){
    if(animating) return;
    if(!isAdjacent(x,y, blank.x, blank.y)) return;
    slideTile(x,y, blank.x, blank.y);
  }

  // Slide animation: move tile at (x,y) to blank position (bx,by)
  function slideTile(x,y, bx,by){
    const t = tileAt(x,y);
    if(!t) return;
    animating = true;
    const tileSize = Math.floor(BOARD_PIX / gridSize);
    const el = t.el;
    // animate by updating left/top with CSS transition
    el.style.left = (bx * tileSize) + "px";
    el.style.top = (by * tileSize) + "px";

    // update coordinates after transition
    setTimeout(() => {
      // swap coordinates in model
      t.x = bx; t.y = by;
      // blank becomes previous tile pos
      blank.x = x; blank.y = y;
      // re-order tiles array and DOM for consistent indexing (not strictly necessary)
      // but we'll re-append all tiles in row-major order (so tab order is predictable)
      reorderDOM();
      animating = false;
      if(checkWin()) showWin();
    }, 230);
  }

  function reorderDOM(){
    // sort tiles by y then x
    tiles.sort((a,b) => (a.y - b.y) || (a.x - b.x));
    board.innerHTML = "";
    tiles.forEach(t => board.appendChild(t.el));
  }

  // Shuffle by making legal random moves to guarantee solvability
  function shuffleBoard(){
    let moves = 0;
    const maxMoves = gridSize * gridSize * 15;
    const shuffleInterval = setInterval(() => {
      const options = getMovablePositions();
      const pick = options[Math.floor(Math.random() * options.length)];
      // move without animation (instant) for speed
      const tile = tileAt(pick.x, pick.y);
      // directly set position visually (no transform)
      const tileSize = Math.floor(BOARD_PIX / gridSize);
      tile.el.style.transition = "none";
      tile.el.style.left = (blank.x * tileSize) + "px";
      tile.el.style.top = (blank.y * tileSize) + "px";
      // swap model
      [tile.x, tile.y, blank.x, blank.y] = [blank.x, blank.y, tile.x, tile.y];
      reorderDOM();
      moves++;
      if(moves >= maxMoves){
        clearInterval(shuffleInterval);
        // re-enable CSS transitions for user moves
        tiles.forEach(t => t.el.style.transition = "left 220ms ease, top 220ms ease");
      }
    }, 6);
  }

  function getMovablePositions(){
    const arr = [];
    const row = blank.y, col = blank.x;
    if(row > 0) arr.push({x:col, y:row-1});
    if(row < gridSize-1) arr.push({x:col, y:row+1});
    if(col > 0) arr.push({x:col-1, y:row});
    if(col < gridSize-1) arr.push({x:col+1, y:row});
    return arr;
  }

  // check solved: every tile is at correctX/correctY (ignore blank)
  function checkWin(){
    return tiles.every(t => {
      if(t.el.classList.contains("empty")) return true;
      return t.x === t.correctX && t.y === t.correctY;
    });
  }

  function showWin(){
    winPopup.classList.remove("hidden");
    setTimeout(()=> {
      // optional: you could auto-hide or do other effects
    }, 250);
  }

  // Reset & menu buttons
  resetBtn.addEventListener("click", () => {
    buildBoard();
    shuffleBoard();
    winPopup.classList.add("hidden");
  });

  menuBtn.addEventListener("click", () => {
    game.classList.add("hidden");
    menu.classList.remove("hidden");
    winPopup.classList.add("hidden");
    // clear active mode so user reselects if they want
    modeBtns.forEach(b => b.classList.remove("active"));
    startBtn.disabled = true;
  });

  backBtn && backBtn.addEventListener("click", () => {
    game.classList.add("hidden");
    winPopup.classList.add("hidden");
    menu.classList.remove("hidden");
  });

  // small accessibility: allow Enter on Start
  startBtn.addEventListener("keyup", (e) => { if(e.key === "Enter") startBtn.click(); });

});
