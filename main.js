const fruits = Array.from("🍇🍈🍉🍊🍋🍋‍🟩🍌🍍🥭🍎🍏🍐🍑🍒🍓🫐🥝🍅🫒🥥🥑");
const animals = randomOrder(
  Array.from("🐵🐶🐺🦊🐱🦁🐯🐴🦄🐮🐷🐽🐭🐹🐰🐻🐨🐼🐸")
);

const playerConfig = {
  "player-1": { left: "ArrowLeft", right: "ArrowRight" }, // arrow keys
  "player-2": { left: "a", right: "d" }, // wasd
  "player-3": { left: "4", right: "6" }, // numpad left/right
};
class Level {
  /**
   *
   * @param {Number} width
   * @param {Number} height
   * @param {HTMLElement} container
   */
  constructor(width, height, grid) {
    this.width = width;
    this.height = height;

    for (let i = 0; i < width * height; i++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset["cellnum"] = i;

      grid.appendChild(cell);
      this.cells.push(cell);
    }
  }
  width = 0;
  height = 0;
  /** @type {Array<HTMLElement>} */
  cells = [];
  /** @type {HTMLElement} */

  addFruit() {
    const freeCells = this.cells.filter((c) => !c.classList.contains("snake"));
    if (freeCells.length == 0) {
      return;
    }
    const fruitCell = randomElement(freeCells);
    fruitCell.classList.add("fruit");
    fruitCell.textContent = randomElement(fruits);
  }
}

class Snake {
  /** @type {Array<HTMLElement>} */
  cells = [];
  id;
  emoji;

  /**
   * 0 = up
   * 1 = right
   * 2 = down
   * 3 = left
   */
  direction = 0;
  position = 0;
  dead = false;

  eaten = [];

  /**
   * @param {string} id
   * @param {Level} level
   * @param {number} position
   */
  constructor(id, level) {
    this.id = id;
    this.emoji = animals.pop();
    // initialize with random direction on random free cell
    this.direction = Math.floor(Math.random() * 4);
    const freeCells = level.cells.filter(
      (c) => !c.classList.contains("snake") && !c.classList.contains("fruit")
    );

    const cell = randomElement(freeCells);
    this.position = parseInt(cell.dataset["cellnum"]);
    cell.classList.add("snake", id, "head");
    cell.textContent = this.emoji;
    this.cells = [cell];
  }

  changeDirection(delta) {
    this.direction = (this.direction + 4 + delta) % 4;
  }

  /**
   * @param {Level} level
   */
  move(level) {
    const oldPos = this.position;
    let newPos = this.position;
    switch (this.direction) {
      case 0:
        newPos = this.position - level.width;
        // leave level on the top
        if (newPos < 0) {
          newPos = newPos + level.cells.length;
        }
        break;

      case 1:
        newPos = this.position + 1;
        // leave level on the right
        if (oldPos % level.width == level.width - 1) {
          newPos = newPos - level.width;
        }
        break;

      case 2:
        newPos = this.position + level.width;
        // leave level on the bottom
        if (newPos >= level.cells.length) {
          newPos = newPos - level.cells.length;
        }
        break;
      case 3:
        newPos = this.position - 1;
        if (oldPos % level.width == 0) {
          newPos = newPos + level.width;
        }
        break;
    }
    this.position = newPos;

    const oldCell = level.cells[oldPos];
    const newCell = level.cells[newPos];

    // if cell is already taken, snake dies
    if (newCell.classList.contains("snake")) {
      this.dead = true;
      return { oldPos, newPos };
    }

    if (newCell.classList.contains("fruit")) {
      newCell.classList.remove("fruit");
      const fruit = newCell.textContent;
      this.eaten.push(fruit);
      newCell.textContent = "";
      this.cells.push(oldCell);
      level.addFruit();
      document.dispatchEvent(
        new CustomEvent("snake:update-score", {
          detail: { player: this, fruit },
        })
      );
    }

    oldCell.classList.remove("head");
    oldCell.textContent = "";
    newCell.classList.add("snake", this.id, "head");
    newCell.textContent = this.emoji;

    // add the new cell to the snake, remove oldest cell from the snake
    this.cells.push(newCell);
    this.cells.shift().classList.remove("snake", this.id);

    return { oldPos, newPos };
  }
}

class Game {
  level;
  /** @type {Array<Snake>} */
  snakes = [];
  speed = 0;
  intervalId = 0;

  /**
   * @param {Level} level
   */
  constructor(level) {
    this.level = level;
    level.addFruit();
  }

  getOrCreateSnake(id) {
    let snake = this.snakes.find((s) => s.id === id);
    if (snake) {
      return snake;
    }

    snake = new Snake(id, this.level);
    this.snakes.push(snake);
    document.dispatchEvent(
      new CustomEvent("snake:player-added", { detail: { player: snake } })
    );
    return snake;
  }

  adjustSpeed(delta) {
    this.speed = clamp(this.speed + delta, 1, 20);
    this.stop();
    this.intervalId = setInterval(() => this.tick(), 1000 / this.speed);
    document.dispatchEvent(new Event("snake:update-speed"));
  }

  tick() {
    /**@type {Array<Snake>} */
    const snakes = randomOrder(this.snakes);

    for (const snake of snakes) {
      if (snake.dead) {
        continue;
      }
      console.log("tick for", snake);

      snake.move(this.level);
      if (snakes.length > 1 && snakes.filter((s) => s.dead).length == 1) {
        // player won
        this.stop();
        document.dispatchEvent(new Event("snake:player-won"));
      }
      if (snakes.length == 1 && snakes[0].dead) {
        this.stop();
        document.dispatchEvent(new Event("snake:gameover"));
      }
    }
  }
  stop() {
    clearInterval(this.intervalId);
  }
}

const queryParams = new URLSearchParams(window.location.search);
function fromQuery(key, defaultValue, fn) {
  let v = queryParams.get(key);
  if (v === null) {
    return defaultValue;
  }
  if (fn) {
    v = fn(v);
  }
  return v;
}

const level = new Level(
  fromQuery("width", 20, parseInt),
  fromQuery("height", 20, parseInt),
  document.querySelector(".grid")
);

const game = new Game(level);

document.addEventListener("snake:update-speed", () => {
  document.getElementById("speed").textContent = game.speed;
});

document.addEventListener("snake:update-score", (ev) => {
  const scoreElm = document.getElementById("score");
  scoreElm.innerHTML = "";
  for (const s of game.snakes) {
    const d = document.createElement("div");
    d.textContent = `${s.emoji} => ${s.eaten.join("")} (${s.eaten.length})`;
    scoreElm.appendChild(d);
  }
  const { player, fruit } = ev.detail;
  const announceElm = document.getElementById("announcement");
  announceElm.textContent = `${player.emoji} ate a ${fruit}!`;
});

document.addEventListener("snake:player-won", () => {
  const elm = document.getElementById("announcement");
  const winner = game.snakes.find((s) => !s.dead);
  elm.textContent = `${winner.emoji} won! 🏆🏆🏆`;
});

document.addEventListener("snake:gameover", () => {
  const elm = document.getElementById("announcement");
  elm.textContent = `💀💀💀 Game Over! 💀💀💀`;
});

document.addEventListener("snake:player-added", (ev) => {
  const elm = document.getElementById("announcement");
  const { emoji } = ev.detail.player;
  elm.textContent = `${emoji} entered the game`;
});

document.addEventListener("keydown", (evt) =>
  (keydownTable[evt.key] || (() => {}))()
);

//
// some simple helper functions
//
function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomOrder(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const keydownTable = Object.entries(playerConfig).reduce(
  (acc, [id, conf]) => {
    acc[conf.left] = () => game.getOrCreateSnake(id).changeDirection(-1);
    acc[conf.right] = () => game.getOrCreateSnake(id).changeDirection(+1);
    return acc;
  },
  {
    "+": () => game.adjustSpeed(+1),
    "-": () => game.adjustSpeed(-1),
  }
);

// if an error occures, stop the game
window.onerror = () => {
  console.log("error occured");
  game.stop();
};

// start game
game.adjustSpeed(fromQuery("speed", 5, parseInt));
