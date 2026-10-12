// An example sketch, so the page has something to show.
// LET GOOOOO
// so i learned a lot from this artist: //https://openprocessing.org/@guilhermesv/2225777#code
//I recreated it twice, and then was like, I will now make smth oringial from the strucutre, a game!
//So that it can be interactive and fun.
let backgroundColor = "rgb(11, 29, 80)";
let outlineColor = "rgb(253, 214, 175)";
let selectedColor = "rgba(143, 226, 9, 0.59)";


//targeting an object so I don't have to define the location size each time.
let targetObj;

//fixed: the planet's x position for level 3. it has to live up here (not inside draw) so it remembers
//where it was last frame, otherwise it would reset every frame and never move.
let planet_x = 0;
let planet_y = 0; //fixed: planet_y was never made, so planet_y += speed_y crashed as soon as level 3 started.
//fixed: speed_x and speed_y moved up here from inside draw(). setting them to 2 every frame
//undid the bounce straight away, so the planet could never turn around.
let speed_x = 2;
let speed_y = 2;
let shrink = 0;
let planet_color = "rgb(47, 79, 216)"; //fixed: the planet's colour is saved here so a bounce can change it and it stays changed.

let numCols = 8;
let numRows = 6;
let colors = [];
let target_col = 0;
let target_row = 0;

//levels: how I differ the shapes and game experience
let level_1 = true;
let level_2 = false;
let level_3 = false;
let level_4 = false;
let level_5 = false;
let level_6 = false;
let level_7 = false;
let level_8 = false;
let level_9 = false;
let level_10 = false;

let level_names = [
  "LEVEL 1 ",
  "LEVEL 2 ",
  "LEVEL 3 ",
  "LEVEL 4 ",
  "LEVEL 5 ",
  "LEVEL 6 ",
  "LEVEL 7",
  "LEVEL 8 ",
  "LEVEL 9 ",
  "LEVEL 10 ",
];

function setup() {
  const canvas = createCanvas(sketch_holder_width(), windowHeight); // I want this full SCREEN FULL.

  canvas.parent("sketch-holder");

  for (let i = 0; i < numCols; i++) {
    colors[i] = [];
    for (let j = 0; j < numRows; j++) {
      colors[i][j] = [random(1, 255), random(1, 255), random(1, 255)];
    }
  }
}

//set up stuff, nothing fun.

// This function returns the widthh, so how wide the sketch-holder div is, in pixels.
function sketch_holder_width() {
  return document.getElementById("sketch-holder").clientWidth;
}

// APParently P5 calls this when the window changes size, so the canvas stays full width.
function windowResized() {
  resizeCanvas(sketch_holder_width(), windowHeight);
}

//HERE THE DRAW LOOPS BEGINS.

function draw() {
  //fixed: moved background() out of the level 1 if. it only cleared the screen on level 1,
  //so on level 2 nothing wiped the last frame and the mouse circle left a smeared trail.
  background(backgroundColor); //useing variable so I can change things at the top.
  noStroke();

  //fixed: forget last frame's target. each level sets its own below, or leaves it null so clicks do nothing.
  targetObj = null;

  //let the levels begin
  if (level_1 == true) {
    //learning to use a function, text function/basic shapes.
    //Save where the circle is in targetObj, so mousePressed() knows what to check.
    targetObj = { x: width / 2, y: height / 2, size: 160 };
    fill(47, 79, 216);
    circle(targetObj.x, targetObj.y, targetObj.size);
    Screen_text(
      width / 2,
      height / 2,
      "You're not sure why you exist. BUT you do anyway.",
      24,
    );
    Screen_text(width / 2, height / 2 + 50, "try clicking on the circle", 10);
  }

  if (level_2 == true) {
    //when we learned random colors.
    targetObj = { x: width / 2, y: height / 2, size: 160 };
    fill(random(50, 100), 79, 216);
    circle(targetObj.x, targetObj.y, targetObj.size);
    Screen_text(width / 2, height / 2, "What do you see?", 24);
    Screen_text(width / 2, height / 2 + 50, "is it a planet?", 10);
  }

  if (level_3 == true) {
    //learning to use bouncing
    //fixed: removed speed_x = 2 and speed_y = 2 from here (they're at the top now, see there).
    planet_x += speed_x;
    planet_y += speed_y;


    //fixed: removed the "restart on the left" part. it fought with the bounce, now the walls turn it around instead.

    //fixed: y uses planet_y, it was height / 2 so the planet could never move up or down.
    targetObj = { x: planet_x, y: planet_y, size: 160 }; // x uses planet_x so the click follows the planet.
    let radius = targetObj.size / 2; //fixed: circle() size is the WIDTH, so the edge is only half of it away from the middle.

    //fixed: moved the wall checks BEFORE drawing, so the colour change shows on the same frame.
    //left and right wall
    //fixed: x + size -> x + radius, and "x - targetObj" -> x - radius (minus a whole object gives NaN, so it never bounced).
    if (targetObj.x + radius >= width || targetObj.x - radius <= 0) {
      speed_x = speed_x * -1; //fixed: was speed_y * -1, flip its OWN speed to bounce back.
      //fixed: fill() here did nothing, the planet was already drawn. saving it in planet_color makes it stick.
      planet_color = color(random(255), random(255), random(255));
    }

    //top and bottom wall
    //fixed: x + y -> y + radius (adding x and y together isn't the bottom edge), and size -> radius.
    if (targetObj.y + radius >= height || targetObj.y - radius <= 0) {
      speed_y = speed_y * -1; //fixed: was speed_x = speed_y * -1, top/bottom walls flip the UP-DOWN speed.
      planet_color = color(random(255), random(255), random(255));
    }
    //fixed: removed shrinking = true. shrinking was never made or used anywhere, add it back when you do the shrink.

    fill(planet_color); //fixed: uses the saved colour.
    circle(targetObj.x, targetObj.y, targetObj.size);
    Screen_text(width / 2, height / 2, "what if it moved?", 24);
    Screen_text(width / 2, height / 2 + 50, "can you click it still?", 10);
  }

  if (level_4 == true) {
    let colWidth = width / numCols;
    let rowHeight = height / numRows;
    let w = map(mouseX, 0, width, 15, 80, true);

    for (let col = 0; col < numCols; col++) {
      for (let row = 0; row < numRows; row++) {
        let x = col * colWidth;
        let y = row * rowHeight;

        if (col === target_col && row === target_row) {
          //the matching square: painted the same colour as your planet.
          targetObj = { x: x, y: y, w: colWidth, h: rowHeight };
          fill(planet_color);
        } else {
          let c = colors[col][row];
          fill(c[0], c[1], c[2]);
        }
        rect(x, y, colWidth, rowHeight);
      }
    }

    Screen_text(
      width / 2,
      height / 2,
      "Can you remember which planet/object you choose?",
      24,
    );
    Screen_text(width / 2, height / 2 + 50, "match its colour to a square", 10);

    //your planet follows the mouse, so you can hold it up against the squares.
    stroke(outlineColor);
    strokeWeight(2);
    fill(planet_color);
    circle(mouseX, mouseY, w + 40);
    noStroke();
  } else {
    fill(255, 180, 60);
    circle(mouseX, mouseY, 40);
  }
}

function next_level() {
  if (level_1) {
    level_1 = false;
    level_2 = true;
  } else if (level_2) {
    level_2 = false;
    level_3 = true;
    planet_x = width / 2; //fixed: level 3 starts with the planet in the middle, where it was on level 2.
    planet_y = height / 2; //fixed: same for up-down, otherwise it starts at 0 (half off the top) and gets stuck bouncing.
  } else if (level_3) {
    level_3 = false;
    level_4 = true;
    target_col = floor(random(numCols));
    target_row = floor(random(numRows));
  } else if (level_4) {
    level_4 = false;
    level_5 = true;
    //fixed: removed the timer and best_time lines, they were copied from the old game.
    //timer, start_time and best_time don't exist in this file, so it crashed on the last level.
  }
  //fixed: removed target_cell = floor(random(grid_column_count * grid_row_count)).
  //also from the old game, none of those exist here, so it crashed on EVERY click.
}

//text function so I don't need to do it all on draw TOO mcuh going ong.
function Screen_text(x, y, textinput, text_size) {
  push();
  //so if I use a grid and stuff this is like to it self, no past rules.
  noStroke();
  fill(outlineColor);
  textSize(text_size);
  textAlign(CENTER, CENTER); //lines the words up in the middle of the box.
  let s = textinput;
  //fixed: x - 150 and y - 100 (half the box) so x, y is the middle of the box, not its top-left corner.
  text(s, x - 150, y - 100, 300, 200); //standard bubble of the paragraph last 2.
  pop(); //nobody follow what ever this is.
}

//fixed: mousepressed -> mousePressed. p5 only calls it if the capital P is there.
//fixed: removed (x, y). p5 doesn't hand it the shape's position, it gets that from targetObj instead.
function mousePressed() {
  //fixed: removed "mousepressed &&", this only runs on a click anyway, and a function name always counts as true.
  //fixed: targetObj && stops a crash when this level has nothing to click (targetObj is null).
  //fixed: "mousepressed dis(mouseX, x)" was a syntax error (two things with nothing between), it broke the whole file.
  //fixed: dis -> dist, and it needs 4 numbers: mouse x, mouse y, target x, target y.
  //fixed: <= size / 2 instead of <= 10, so the whole circle counts, not just 10px around the middle.
  if (!targetObj) {
    return;
  }

  let hit;
  if (targetObj.w) {
    //a square target (level 4): is the mouse inside the rectangle?
    hit =
      mouseX >= targetObj.x &&
      mouseX <= targetObj.x + targetObj.w &&
      mouseY >= targetObj.y &&
      mouseY <= targetObj.y + targetObj.h;
  } else {
    //a circle target (levels 1-3): is the mouse closer than the radius?
    hit = dist(mouseX, mouseY, targetObj.x, targetObj.y) <= targetObj.size / 2;
  }

  if (hit) {
    next_level(); //fixed: return next_level -> next_level(). without () it doesn't run.
  }
}
