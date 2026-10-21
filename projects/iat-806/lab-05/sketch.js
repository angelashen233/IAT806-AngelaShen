// An example sketch, so the page has something to show.
// Delete all of this and write your own.

//let xPostion = [100, 200, 300];

let myBall;
let myBall2;
let myBalls = [];
let numberOfBalls = 8;

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

  for (let i = 0; i < numberOfBalls; i++) {
    let ballR = random(50, 100);
    let ballX = random(ballR, width - ballR);
    let ballY = random(ballR, height - ballR);
    //added: blue and orange in the list. it was only greys before (r, g, b almost equal = grey),
    //so random() could only ever pick a grey. your grey is still in there too.
    let ballColor = random([
      color(47, 79, 216),
      color(255, 180, 60),
      color(120, 130, 140),
    ]);
    let ball = new Ball(ballX, ballY, ballColor, ballR);
    myBalls.push(ball); //put smth inside of the array
  }

  for (let i = 0; i < numberOfBalls; i++) {
    let ballR = random(50, 100);
    let ballX = random(ballR, width - ballR);
    let ballY = random(ballR, height - ballR);
    //added: a fully random colour for each ball, like the lab-04 grid. was a pick between grey and black.
    let ballColor = color(random(255), random(255), random(255));
    let ball = new Ball(ballX, ballY, ballColor, ballR);
    myBalls.push(ball); //put smth inside of the array
  }
}

function draw() {
  background(253, 253, 251);

  for (let ball of myBalls) {
    ball.move();
    ball.show();
  }

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

//added: click on the canvas and every ball gets a new colour.
function mousePressed() {
  // ignore clicks on the page that aren't on the canvas (same check as lab-04)
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    return;
  }

  for (let i = 0; i < myBalls.length; i++) {
    if (i < numberOfBalls) {
      // the first 8 balls came from the first loop, so they pick from the same blue / orange / grey list
      myBalls[i].color = random([
        color(47, 79, 216),
        color(255, 180, 60),
        color(120, 130, 140),
      ]);
    } else {
      // the rest came from the second loop, so they get a fully random colour again
      myBalls[i].color = color(random(255), random(255), random(255));
    }
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
  }

  show() {
    fill(this.color); // (120, 130, 140);
    circle(this.x, this.y, this.r * 2);
    circle(this.x - 50, this.y - 50, this.r * 0.5);
    circle(this.x + 50, this.y + 50, this.r * 0.5);
  }

  move() {
    this.x += random(mouseX / 100, 5) * this.dirX;
    this.y += random(mouseY / 100, 5) * this.dirY;

    if (this.x + this.r >= width || this.x - this.r <= 0) {
      this.dirX *= -1;
    }
    if (this.y + this.r >= height || this.y - this.r <= 0) {
      this.dirY *= -1;
    }
  }
}
