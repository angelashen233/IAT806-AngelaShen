// An example sketch, so the page has something to show.
// Delete all of this and write your own.

//let xPostion = [100, 200, 300];

let myBall;
let myBall2;

//settings: change these numbers to make the game easier or harder.
let numberOfBalls = 5; //how many balls each round starts with.
let maxBalls = 150; //stops making babies here, so the reaction can't freeze the browser.
let restFrames = 60; //after making a baby, a ball has to wait this many frames (1 second) to make another.
let maxBounces = 8; //after this many wall bounces, a ball starts to fade away (decay).
let fadeSpeed = 3; //how much see-through it gets each frame. 255 / 3 = about 85 frames (1.5 seconds) to vanish.
let explosionSound; //stays undefined until the mp3 has loaded.

//one of each class, made in setup().
let game; //runs the levels: what's on screen, who won, what space and clicks do.
let reactor; //the frame the balls bounce inside.
let bucket; //level 1: the mouse is a bucket of water.
let neutronGun; //level 2: the mouse fires neutrons that add new atoms.
let speedBar; //the slow / fast bar along the bottom.

function setup() {
  const canvas = createCanvas(600, 600);

  // Puts the canvas inside the <div id="sketch-holder"> in index.html,
  // instead of dropping it at the bottom of the page.
  let x = 50;
  let y = 100;
  let c = random([color(120, 130, 140), color(50, 50, 50)]);
  let r = random(50, 400);
  //yBall = Ball();
  myBall = new Ball(x, y, c, r);
  myBall2 = new Ball(x, y, c, r);
  canvas.parent("sketch-holder");

  reactor = new Reactor(60);
  bucket = new Bucket(25);
  neutronGun = new NeutronGun();
  speedBar = new SpeedBar();
  noCursor(); //hides the arrow, the bucket or the neutron gun is drawn there instead.

  //no await, so the balls show up right away and the sound is ready a little later (like lab-04's music).
  loadSound("soundreality-explosion-fx-343683.mp3").then((s) => {
    explosionSound = s;
  });

  game = new Game();
  game.newRound(1);
}

function draw() {
  game.update();
  game.show();

  // myBall.move();
  // myBall.show();
  // myBall2.show();

  // noStroke();
  // fill(47, 79, 216);
  // // circle(width / 2, height / 2, 160);
  // // circle(width / 2, height / 2, 160);
  // // circle(width / 2, height / 2, 160);
  // fill(255, 180, 60);
  // circle(mouseX, mouseY, 40);

  // for (i = 0; i < 5; i++) {
  //   circle(50 + i * 100, height / 2, mouseX);
  // }
}

function keyPressed() {
  if (key === " ") {
    game.space();
  }

  return false; //stops the space bar from scrolling the page.
}

function mousePressed() {
  // ignore clicks on the page that aren't on the canvas (same check as lab-04)
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    return;
  }
  game.click();
}

//every other ball: one from the blue / orange / grey list, then one fully random colour.
function pickColor(i) {
  if (i % 2 === 0) {
    return random([color(47, 79, 216), color(255, 180, 60), color(120, 130, 140)]);
  }
  return color(random(255), random(255), random(255));
}

//THE GAME: 2 levels.
//level 1: the reaction is dangerous. use the water bucket to put every atom out before it explodes.
//level 2: now do the opposite. fire neutrons to keep the reaction going until it explodes.
//state is one of: "waiting" (before the click), "running", "won", "lost".
class Game {
  constructor() {
    this.level = 1;
    this.state = "waiting";
    this.exploded = false; //true while the white BOOM screen is showing.
    this.balls = [];
    this.flashes = [];
    this.startCount = 0; //how many balls this round began with, so the red counts from there.
  }

  //clears everything and puts numberOfBalls calm balls in the reactor, waiting for a click.
  newRound(level) {
    this.level = level;
    this.state = "waiting";
    this.exploded = false;
    this.balls = [];
    this.flashes = [];

    for (let i = 0; i < numberOfBalls; i++) {
      let ballR = random(15, 30);
      let ballX = random(reactor.left + ballR, reactor.right - ballR);
      let ballY = random(reactor.top + ballR, reactor.bottom - ballR);
      this.balls.push(new Ball(ballX, ballY, pickColor(i), ballR)); //put smth inside of the array
    }
    this.startCount = this.balls.length;
  }

  //0 = normal, 1 = fully red. one step redder for every 10 balls born after the start.
  heat() {
    let redSteps = floor((this.balls.length - this.startCount) / 10);
    let maxSteps = floor((maxBalls - this.startCount) / 10); //how many steps until it explodes.
    return constrain(redSteps / maxSteps, 0, 1);
  }

  //the moving part, once every frame. only does anything while the reaction is running.
  update() {
    if (this.state !== "running") {
      return;
    }

    for (let ball of this.balls) {
      ball.move();
    }
    this.nuclearFusion();
    if (this.level === 1) {
      bucket.pour(this);
    }
    this.decay();

    //how the round ends:
    //fully red = explosion. that's losing on level 1 and winning on level 2.
    //no atoms left = the reaction stopped. that's winning on level 1 and losing on level 2.
    if (this.heat() >= 1) {
      this.explode();
    } else if (this.balls.length === 0) {
      if (this.level === 1) {
        this.state = "won";
      } else {
        this.state = "lost";
      }
    }
  }

  //NUCLEAR FUSION: the reaction itself.
  //1. checks every pair of balls to see if they touch.
  //2. touching balls bounce apart.
  //3. if both are rested, not decaying, and there's room (under maxBalls), they fuse: a baby is born
  //   between them, with half of each parent's colour, a bit smaller, and an orange flash ring.
  nuclearFusion() {
    let babies = []; //new balls wait here, so the loop isn't checking balls that were just born.

    for (let i = 0; i < this.balls.length; i++) {
      //j starts at i + 1, so each pair is only checked once (a with b, never b with a again).
      for (let j = i + 1; j < this.balls.length; j++) {
        let a = this.balls[i];
        let b = this.balls[j];

        //touching = the middles are closer than the two radiuses added together.
        if (dist(a.x, a.y, b.x, b.y) <= a.r + b.r) {
          a.bounceAwayFrom(b);
          b.bounceAwayFrom(a);

          //fading balls are decaying, so they can't fuse any more. they still bounce.
          let rested = a.rest === 0 && b.rest === 0 && !a.fading() && !b.fading();
          let room = this.balls.length + babies.length < maxBalls;
          if (rested && room) {
            let babyX = (a.x + b.x) / 2;
            let babyY = (a.y + b.y) / 2;
            let babyColor = lerpColor(a.color, b.color, 0.5); //half of each parent's colour.
            let babyR = max(8, ((a.r + b.r) / 2) * 0.8); //a bit smaller than its parents.
            let baby = new Ball(babyX, babyY, babyColor, babyR);

            a.rest = restFrames;
            b.rest = restFrames;
            baby.rest = restFrames; //so the baby doesn't instantly fuse with its own parents.
            babies.push(baby);
            this.flashes.push(new Flash(babyX, babyY, [255, 180, 60]));
          }
        }
      }
    }

    for (let baby of babies) {
      this.balls.push(baby);
    }
  }

  //takes away every ball that has faded all the way out.
  decay() {
    //going backwards, so removing a ball doesn't skip the next one.
    for (let i = this.balls.length - 1; i >= 0; i--) {
      if (this.balls[i].alpha <= 0) {
        this.balls.splice(i, 1);
      }
    }
  }

  //completely red: the sound plays once and all the atoms are gone.
  explode() {
    this.exploded = true;
    this.balls = [];
    this.flashes = [];
    if (this.level === 2) {
      this.state = "won";
    } else {
      this.state = "lost";
    }
    if (explosionSound) {
      explosionSound.play();
    }
  }

  //space: after a win, go to the other level. any other time, restart this level.
  space() {
    if (this.state === "won") {
      if (this.level === 1) {
        this.newRound(2);
      } else {
        this.newRound(1); //beat level 2, so it starts over from the beginning.
      }
    } else {
      this.newRound(this.level);
    }
  }

  //the first click starts the reaction.
  //after that: level 1 clicks change the colours like before, level 2 clicks fire a neutron.
  click() {
    if (this.state === "waiting") {
      this.state = "running";
      userStartAudio(); //browsers block sound until a click, so the explosion can be heard later.
      return;
    }
    if (this.state !== "running") {
      return;
    }

    if (this.level === 1) {
      for (let i = 0; i < this.balls.length; i++) {
        this.balls[i].color = pickColor(i);
      }
    } else {
      neutronGun.fire(this);
    }
  }

  //everything you see, once every frame.
  show() {
    //exploded: a white screen and nothing else until space is pressed.
    if (this.exploded) {
      background(255);
      if (this.level === 2) {
        this.bigMessage("BOOM!", "you caused the explosion! press space to play again from level 1");
      } else {
        this.bigMessage("BOOM", "it melted down. press space to try level 1 again");
      }
      this.showCursor();
      return;
    }

    background(lerpColor(color(253, 253, 251), color(200, 20, 20), this.heat()));
    reactor.show();

    for (let ball of this.balls) {
      ball.show();
    }

    //going backwards, so removing a finished flash doesn't skip the next one.
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      this.flashes[i].show();
      if (this.flashes[i].done()) {
        this.flashes.splice(i, 1);
      }
    }

    //the goal for this level, at the top above the reactor.
    if (this.level === 1) {
      this.smallText("LEVEL 1: use the water bucket to stop the reaction", 30);
    } else {
      this.smallText("LEVEL 2: click to fire neutrons and make it explode", 30);
    }

    //what's happening now, at the bottom above the speed bar.
    if (this.state === "waiting") {
      this.smallText("click to start the nuclear reaction", height - 42);
    } else if (this.state === "running") {
      this.smallText("atoms: " + this.balls.length, height - 42);
    } else if (this.state === "won") {
      this.smallText("you stopped the reaction! press space for level 2", height - 42);
    } else {
      this.smallText("the reaction died out. press space to try level 2 again", height - 42);
    }

    speedBar.show();
    this.showCursor(); //drawn last, so it's on top of everything.
  }

  //level 1 shows the bucket, level 2 shows the neutron gun.
  showCursor() {
    if (this.level === 1) {
      bucket.show(mouseX, mouseY);
    } else {
      neutronGun.show(mouseX, mouseY);
    }
  }

  smallText(words, y) {
    push();
    noStroke();
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(words, width / 2, y);
    pop();
  }

  bigMessage(title, words) {
    push();
    noStroke();
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(32);
    text(title, width / 2, height / 2 - 30);
    textSize(16);
    text(words, width / 2, height / 2 + 20);
    pop();
  }
}

//the reactor: a smaller frame inside the canvas. the balls only move inside it.
class Reactor {
  constructor(margin) {
    //margin = gap between the canvas edge and the reactor wall, on every side.
    this.left = margin;
    this.top = margin;
    this.right = width - margin;
    this.bottom = height - margin;
  }

  //is this point inside the reactor walls?
  contains(x, y) {
    return x > this.left && x < this.right && y > this.top && y < this.bottom;
  }

  show() {
    push();
    noFill();
    stroke(0);
    strokeWeight(3);
    rect(this.left, this.top, this.right - this.left, this.bottom - this.top);
    pop();
  }
}

class Ball {
  //upper case ball that is the template
  constructor(x, y, c, r) {
    this.x = x;
    this.y = y;
    this.color = c;
    this.r = r;
    this.dirX = random([-1, 1]);
    this.dirY = random([-1, 1]);
    this.rest = 0; //frames left before this ball can make another baby. 0 = ready.
    this.bounces = 0; //how many times it has hit the reactor wall.
    this.alpha = 255; //255 = solid, 0 = gone.
  }

  //true once it has bounced maxBounces times and started to decay.
  fading() {
    return this.bounces >= maxBounces;
  }

  show() {
    //a copy of its colour with the see-through amount, so this.color itself stays the same.
    let c = color(this.color);
    c.setAlpha(this.alpha);
    fill(c); // (120, 130, 140);
    stroke(0, this.alpha); //the outline fades too, so no empty ring is left behind.
    circle(this.x, this.y, this.r * 2);
    circle(this.x - 50, this.y - 50, this.r * 0.5);
    circle(this.x + 50, this.y + 50, this.r * 0.5);
  }

  move() {
    this.x += random(mouseX / 100, 5) * this.dirX;
    this.y += random(mouseY / 100, 5) * this.dirY;

    //bounces off the reactor frame instead of the canvas edge.
    if (this.x + this.r >= reactor.right || this.x - this.r <= reactor.left) {
      this.dirX *= -1;
      this.bounces += 1;
    }
    if (this.y + this.r >= reactor.bottom || this.y - this.r <= reactor.top) {
      this.dirY *= -1;
      this.bounces += 1;
    }
    //keeps it inside the frame. a baby born half in a wall would otherwise flip every frame and get stuck.
    this.x = constrain(this.x, reactor.left + this.r, reactor.right - this.r);
    this.y = constrain(this.y, reactor.top + this.r, reactor.bottom - this.r);

    if (this.rest > 0) {
      this.rest -= 1;
    }

    if (this.fading()) {
      this.alpha -= fadeSpeed;
    }
  }

  //points this ball away from the other one, so two touching balls fly apart.
  bounceAwayFrom(other) {
    if (this.x < other.x) {
      this.dirX = -1;
    } else {
      this.dirX = 1;
    }
    if (this.y < other.y) {
      this.dirY = -1;
    } else {
      this.dirY = 1;
    }
  }
}

//a ring that grows and fades. orange where a fusion happened, blue where water put a ball out.
class Flash {
  constructor(x, y, c) {
    this.x = x;
    this.y = y;
    this.c = c; //[r, g, b]
    this.size = 0;
  }

  show() {
    push();
    noFill();
    strokeWeight(3);
    stroke(this.c[0], this.c[1], this.c[2], map(this.size, 0, 80, 255, 0));
    circle(this.x, this.y, this.size);
    pop();
    this.size += 4;
  }

  //true once it has grown all the way and faded out.
  done() {
    return this.size > 80;
  }
}

//LEVEL 1: the mouse is a bucket of water. any ball it touches gets put out.
class Bucket {
  constructor(size) {
    this.size = size; //how far from the mouse the water reaches.
  }

  //any ball touching the bucket is put out (removed), with a blue splash.
  pour(game) {
    //going backwards, so removing a ball doesn't skip the next one.
    for (let i = game.balls.length - 1; i >= 0; i--) {
      let ball = game.balls[i];
      if (dist(mouseX, mouseY, ball.x, ball.y) <= ball.r + this.size) {
        game.flashes.push(new Flash(ball.x, ball.y, [80, 160, 255]));
        game.balls.splice(i, 1);
      }
    }
  }

  //a little grey bucket with water on top.
  show(x, y) {
    push();
    translate(x, y); //(0, 0) is now the mouse, so the shapes below are drawn around it.
    stroke(60);
    strokeWeight(2);
    noFill();
    arc(0, -15, 44, 36, PI, TWO_PI); //the handle
    fill(150, 155, 165);
    quad(-20, -15, 20, -15, 14, 20, -14, 20); //the bucket
    fill(80, 160, 255);
    ellipse(0, -15, 40, 8); //the water on top
    pop();
  }
}

//LEVEL 2: the mouse fires neutrons. each click inside the reactor adds a new atom, to feed the reaction.
class NeutronGun {
  fire(game) {
    if (!reactor.contains(mouseX, mouseY) || game.balls.length >= maxBalls) {
      return;
    }
    let ball = new Ball(mouseX, mouseY, color(random(255), random(255), random(255)), random(15, 30));
    game.balls.push(ball);
    game.flashes.push(new Flash(mouseX, mouseY, [255, 180, 60]));
  }

  //an orange dot with a ring around it, like a target.
  show(x, y) {
    push();
    stroke(200, 90, 0);
    strokeWeight(2);
    noFill();
    circle(x, y, 30);
    line(x - 20, y, x - 10, y);
    line(x + 10, y, x + 20, y);
    line(x, y - 20, x, y - 10);
    line(x, y + 10, x, y + 20);
    noStroke();
    fill(255, 140, 0);
    circle(x, y, 8);
    pop();
  }
}

//a bar along the bottom that fills up to the mouse: left = slow, right = fast.
//it shows mouseX, the side-to-side speed in Ball's move(). (mouseY still sets the up-down speed.)
class SpeedBar {
  show() {
    let barY = height - 20;
    let barW = reactor.right - reactor.left; //same width as the reactor frame, so it lines up under it.
    let filled = constrain(mouseX - reactor.left, 0, barW); //how much of the bar the mouse has reached.

    push();
    noStroke();
    fill(0, 40);
    rect(reactor.left, barY - 4, barW, 8, 4); //the empty bar
    //colour goes from blue (slow) to orange (fast) as the mouse moves right.
    fill(lerpColor(color(47, 79, 216), color(255, 180, 60), filled / barW));
    rect(reactor.left, barY - 4, filled, 8, 4); //the filled part, up to the mouse
    circle(reactor.left + filled, barY, 14); //a knob at the end of the fill

    fill(0);
    textSize(12);
    textAlign(CENTER, CENTER);
    text("slow", reactor.left / 2, barY);
    text("fast", width - reactor.left / 2, barY);
    pop();
  }
}
