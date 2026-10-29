console.log("doing code without AI");
console.log("Let it start");
function setup() {
  createCanvas(800, 600);
}

function draw() {
  background(5, 4, 48);
  firefly(50, 50, (255, 249, 250), random(50, 60), random(140, 150));
}

function firefly(x, y, color, wingsx, wingsy) {
  //var x = 10;
  //var y = 20;
  push();
  translate(x, y);
  stroke(255, 249, 196);
  fill(5, 4, 48);
  circle(100, 70, 20);

  line(60, 80 - 0, 80 + 20, 90);
  line(140, 80 - 0, 80 + 20, 90);

  line(140, 80 - 20, 80 + 20, 95);
  line(60, 80 - 20, 80 + 20, 95);

  line(140 - 20, 80 + 60, 80 + 30, 100);
  line(60 + 10, 80 + 60, 80 + 20, 100);

  fill(255, 120, 60);
  circle(100, 100, 50);
  fill(color);
  circle(50, 100, 60);
  circle(150, 100, 60);

  pop();
}
