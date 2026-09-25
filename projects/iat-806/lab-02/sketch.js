console.log("Lab02");

//global variables
let ballX = 300;
let ballY = 300;
let speedX = 4;
let speedY = 3;
let size = 80;
let radius = size / 2;
let ballColor;
let coinFlip;
let shrinking = false; //becomes true the first time the ball touches a wall so it doesn't shrink even more next wall.
let shrinkSpeed = 0.1; //how much smaller the ball gets each frame
let minSize = 5;

// setup is called once at the start, draw loops every frame.
function setup() {
  createCanvas(600, 600);
  ballColor = color(25);
  coinFlip = random([true, false]);
}

function draw() {
  //constantly running
  background(255, 255, 60);

  ballX = ballX + speedX;
  ballY = ballY + speedY;

  //left and right wall
  if (ballX + radius >= width || ballX - radius <= 0) {
    speedX = speedX * -1;
    shrinking = true;
    ballColor = color(random(255), random(255), random(255));
  }

  //top and bottom wall
  if (ballY + radius >= height || ballY - radius <= 0) {
    speedY = speedY * -1;
    //touching the wall again just sets it to true again, so it doesn't shrink faster
    shrinking = true;
    ballColor = color(random(255), random(255), random(255));
  }
  //once shrinking is true, the ball gets a little smaller

  if (shrinking) {
    size = max(size - shrinkSpeed, minSize);
    radius = size / 2;
  }

  fill(0);
  text("I am a weather predictor and your eye test", 100, 200);
  background(255, 255, random(68));

  fill(60);
  if (size <= 30) {
    text("the ball is now just 30px and smaller!", 50, 70);
  } else {
    text("Can you tell that the ball is getting smaller?", 50, 70);
  }

  if (size <= 10) {
    background(255, 255, random(100));
    text("You can still see the ball?", 50, 90);
  }

  fill(0);
  if (coinFlip) {
    text("Today it will be sunny~", mouseX, random(250, 260));
  } else {
    text("Today it might rain. ", 50, 50);
  }
  fill(0);
  text("I am a weather predictor and your eye test", 300, 300);

  fill(ballColor);
  noStroke();
  circle(ballX, ballY, size);
}

//click to move the ball to the mouse
function mousePressed() {
  size = 80;
  radius = size / 2;
  shrinking = false;
  ballX = constrain(mouseX, radius, width - radius);
  ballY = constrain(mouseY, radius, height - radius);
  coinFlip = random([true, false]);
}
