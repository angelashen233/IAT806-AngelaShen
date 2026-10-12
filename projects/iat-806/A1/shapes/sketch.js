console.log("I believe I can do it!");
console.log("IT's a ladybug-spider hybrid!");
function setup() {
  createCanvas(800, 600);
}

function draw() {
  background(255, 255, 60);
  fill(25);
  circle(100, 70, 20);

  line(60, 80 - 0, 80 + 20, 90);
  line(140, 80 - 0, 80 + 20, 90);

  line(140, 80 - 20, 80 + 20, 95);
  line(60, 80 - 20, 80 + 20, 95);

  line(140 - 20, 80 + 60, 80 + 30, 100);
  line(60 + 10, 80 + 60, 80 + 20, 100);

  fill(255, 120, 60);
  circle(100, 100, 50);
  fill(20);
  circle(110, 100, 10);
  circle(90, 100, 10);

  circle(110, 100 - 14, 10);
  circle(90, 100 - 14, 10);

  circle(110, 100 + 14, 10);
  circle(90, 100 + 14, 10);

  fill(255, 150, 180);
  circle(100, 300, 300);
}
