const levelWidth = 20;
const levelHeight = 20;
let score = 0;

/** @type {Array<HTMLElement>} */
const cells = [];

/** @type {Array<HTMLElement>} */
const snakeCells = [];

const scoreElm = document.getElementById("score");
const speedElm = document.getElementById("speed");

// initialize the level
const level = document.querySelector(".grid");
for (let i = 0; i < levelWidth * levelHeight; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.id = i;

  level.appendChild(cell);
  cells.push(cell);
}

const directions = ["up", "right", "down", "left"];
// directions:
// 0 = up
// 1 = right
// 2 = down
// 3 = left

// randomly pick the start direction
let direction = Math.floor(Math.random() * 4);
// initialize speed with 0, when the game is started, we'll set it to 4 initially
let speed = 0;

// handle of the running game loop
let intervalId = null;

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

function adjustSpeed(step) {
  speed = clamp(speed + step, 1, 20);
  clearInterval(intervalId);
  intervalId = setInterval(gameTick, 1000 / speed);
  speedElm.textContent = speed;
}

// randomly pick the start position
let currentPosition = Math.floor(Math.random() * cells.length);
{
  const initialCell = cells[currentPosition];
  initialCell.classList.add("snake");
  snakeCells.push(initialCell);
}

document.addEventListener("keydown", (evt) => {
  switch (evt.key) {
    case "ArrowLeft":
      // normalize direction to [0,4]
      direction = (direction + 4 - 1) % 4;
      return;
    case "ArrowRight":
      // normalize direction to [0,4]
      direction = (direction + 4 + 1) % 4;
      return;
    case "+":
      adjustSpeed(+1);
      return;
    case "-":
      adjustSpeed(-1);
      return;
  }
});

function addFruit() {
  const possibleCells = document.querySelectorAll(".grid > .cell:not(.snake)");
  const fruitPos = Math.floor(Math.random() * possibleCells.length);
  possibleCells[fruitPos].classList.add("fruit");
}

function gameTick() {
  const oldPosition = currentPosition;
  let newPosition = currentPosition;

  switch (direction) {
    case 0:
      newPosition = currentPosition - levelWidth;
      // leave level on the top
      if (newPosition < 0) {
        newPosition = newPosition + cells.length;
      }
      break;
    case 1:
      newPosition = currentPosition + 1;
      // leave level on the right
      if (oldPosition % levelWidth == levelWidth - 1) {
        newPosition = newPosition - levelWidth;
      }
      break;
    case 2:
      newPosition = currentPosition + levelWidth;
      // leave level on the bottom
      if (newPosition >= cells.length) {
        newPosition = newPosition - cells.length;
      }
      break;
    case 3:
      newPosition = currentPosition - 1;
      if (oldPosition % levelWidth == 0) {
        newPosition = newPosition + levelWidth;
      }
      break;
  }

  const newCell = cells[newPosition];
  const oldCell = cells[oldPosition];

  oldCell.classList.remove("head");
  newCell.classList.add("head", "snake");

  if (snakeCells.includes(newCell)) {
    // game over
    clearInterval(intervalId);
    document.querySelector(".grid").classList.add("gameover");
    return;
  }

  if (newCell.classList.contains("fruit")) {
    newCell.classList.remove("fruit");
    snakeCells.push(oldCell);
    score++;
    scoreElm.textContent = score;
    addFruit();
  }

  // add the new cell to the snake, remove oldest cell from the snake
  snakeCells.push(newCell);
  snakeCells.shift().classList.remove("snake");

  currentPosition = newPosition;
}

// add an initial fruit
addFruit();

// start game
adjustSpeed(5);
