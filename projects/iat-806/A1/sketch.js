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

let planet_grow = 0; //level 5: 0 = faded away, 1 = fully back.

//level 7: the planet's surface, the pattern grid from sketch copy 2.
let seed; //same random numbers every frame, so the pattern doesn't flicker.
let surface_columns = 4;
let surface_colors = []; //made when level 7 starts, includes your planet's colour.
let crown_cell = 0; //which square the hidden crown is in.
let linecolor = "#e4e4e4";

//from sketch copy 2: the pulse clock, the O freeze, and the timer.
let time = 0; //the pulse clock, goes up a little every frame (sketch copy 2's "time").
let wild_speed = 0.02; //how much time goes up each frame. level 8 keeps raising it.
let all_off = false; //true = O was pressed, the pattern freezes.
let timer = 0; //how many seconds the whole game took, set when you finish.
let start_time = 0; //millis() when the game started.
let best_time = null; //fastest finish ever, saved in the browser. null = never finished yet.

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

  //"a1_best_time" not "best_time", so it doesn't mix with the old game's record on the same website.
  best_time = getItem("a1_best_time");
  start_time = millis();
}

//which level is on, as a number (from sketch copy 2's current_level).
function current_level() {
  let levels = [
    level_1,
    level_2,
    level_3,
    level_4,
    level_5,
    level_6,
    level_7,
    level_8,
    level_9,
  ];
  return levels.indexOf(true) + 1;
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

  if (level_5 == true) {
    //how close the mouse is: 1 = right on it, 0 = 250px or more away.
    let d = dist(mouseX, mouseY, planet_x, planet_y);
    let closeness = constrain(map(d, 0, 250, 1, 0), 0, 1);

    //staying close slowly brings it back, wandering off lets it fade again.
    planet_grow += closeness * 0.006 - 0.002;
    planet_grow = constrain(planet_grow, 0, 1);

    let size = lerp(20, 200, planet_grow);

    let c = color(planet_color);
    c.setAlpha(lerp(40, 255, planet_grow)); //see-through when faded, solid when back.

    fill(c);
    circle(planet_x, planet_y, size);

    Screen_text(width / 2, 80, "What if it disappeared one day?", 24);
    Screen_text(width / 2, 130, "stay close to bring it back", 10);

    if (planet_grow >= 1) {
      next_level();
    }
  }

  if (level_6 == true) {
    //the planet is clickable now, so level 6 isn't a dead end.
    targetObj = { x: width / 2, y: height / 2, size: 200 };
    fill(planet_color);
    circle(width / 2, height / 2, 200);
    Screen_text(width / 2, height / 2 - 160, "You brought it back.", 24);
    Screen_text(width / 2, height / 2 + 140, "what's on it? click to land", 10);
  }

  if (level_7 == true || level_8 == true) {
    //the pulse clock stops while O has everything frozen.
    if (!all_off) {
      time += wild_speed;
    }
    randomSeed(seed);
    push(); //keeps the grid's stroke and glow away from the text.
    surface_grid(
      0,
      0,
      surface_columns,
      ceil(height / (width / surface_columns)),
      width,
    );
    pop();
    fill(0, 150); //dark see-through band, so the text is readable on the pattern.
    rect(0, 30, width, 90);
  }

  if (level_7 == true) {
    Screen_text(width / 2, 60, "You land on its surface.", 24);
    Screen_text(
      width / 2,
      100,
      "something is hiding here... find the crown",
      10,
    );
  }

  if (level_8 == true) {
    if (!all_off) {
      wild_speed = min(wild_speed + 0.0004, 0.6); //faster and faster, up to a limit.
      Screen_text(
        width / 2,
        60,
        "It's getting faster... what do you do next?",
        24,
      );
      Screen_text(width / 2, 100, "press O", 10);
    } else {
      //frozen: your planet shows up in the middle, click it to finish.
      targetObj = { x: width / 2, y: height / 2, size: 180 };
      push();
      stroke(outlineColor);
      strokeWeight(3);
      fill(planet_color);
      circle(targetObj.x, targetObj.y, targetObj.size);
      pop();
      Screen_text(width / 2, 60, "It stopped. There it is.", 24);
      Screen_text(width / 2, 100, "click your planet", 10);
    }
  }

  if (level_9 == true) {
    //the ending, with the timer from sketch copy 2.
    fill(planet_color);
    circle(width / 2, height / 2, 200);
    Screen_text(width / 2, height / 2 - 170, "You stayed.", 24);
    let time_text = "Your time: " + nf(timer, 0, 1) + "s";
    if (best_time !== null) {
      time_text += "   Best: " + nf(best_time, 0, 1) + "s";
    }
    Screen_text(width / 2, height / 2 + 160, time_text, 14);
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

  //bottom right: level name and time, like sketch copy 2. drawn last so nothing covers it.
  if (!level_9) {
    let corner =
      level_names[current_level() - 1] +
      "   " +
      nf((millis() - start_time) / 1000, 0, 1) +
      "s";
    Screen_text(width - 170, height - 30, corner, 12);
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
    //level 5 starts with the planet faded, somewhere away from the middle text.
    planet_grow = 0;
    planet_x = random(150, width - 150);
    planet_y = random(250, height - 150);
  } else if (level_5) {
    level_5 = false;
    level_6 = true;
  } else if (level_6) {
    level_6 = false;
    level_7 = true;
    //set up the surface: a new pattern, your planet's colour in the palette, and a hidden crown.
    seed = random(1000);
    surface_colors = [
      planet_color,
      "#8188d4",
      "#e87171",
      "#90ee80",
      "#d881af",
      "#e4db8a",
    ];
    //floor, not ceil: only rows that fit fully on screen, so the crown is never cut off at the bottom.
    let full_rows = max(1, floor(height / (width / surface_columns)));
    crown_cell = floor(random(surface_columns * full_rows));
  } else if (level_7) {
    level_7 = false;
    level_8 = true;
    seed = random(1000); //a new pattern for level 8.
    wild_speed = 0.02;
    all_off = false;
  } else if (level_8) {
    level_8 = false;
    level_9 = true;
    //the end: stop the clock and save it if it's a new record (from sketch copy 2).
    timer = (millis() - start_time) / 1000;
    if (best_time === null || timer < best_time) {
      best_time = timer;
      storeItem("a1_best_time", best_time);
    }
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

//O freezes and unfreezes the pattern (sketch copy 2's keyPressed).
function keyPressed() {
  if (key === "o" || key === "O") {
    all_off = !all_off;
  }
}

//LEVEL 7: the planet's surface. the grid from sketch copy 2, with a crown hidden in one square.//CODE FROM REFRENCEs.
function surface_grid(x_start, y_start, column_count, row_count, total_width) {
  stroke(linecolor);
  strokeWeight(random(1, 3));
  drawingContext.shadowBlur = 5;
  drawingContext.shadowColor = linecolor;

  let cell_size = total_width / column_count;
  let movement_offset = 0;

  for (let j = 0; j < row_count; j++) {
    for (let i = 0; i < column_count; i++) {
      let x = x_start + i * cell_size;
      let y = y_start + j * cell_size;

      let color_index = floor(random(surface_colors.length));
      fill(surface_colors[color_index]);
      rect(x, y, cell_size, cell_size);
      fill(surface_colors[(color_index + 1) % surface_colors.length]);

      //shapes pulse on their own and swell when the mouse is close.
      let pulse = map(sin(time + movement_offset), -1, 1, 0, 1);
      let mouse_distance = dist(
        mouseX,
        mouseY,
        x + cell_size / 2,
        y + cell_size / 2,
      );
      let closeness = constrain(
        map(mouse_distance, 0, cell_size * 2, 1, 0),
        0,
        1,
      );
      let movement;
      if (all_off) {
        movement = 0.5; //O is on: every shape stays still halfway.
      } else {
        movement = map(closeness, 0, 1, 0.3, 1) * map(pulse, 0, 1, 0.6, 1);
      }

      let selector = floor(random(cell_size > 60 ? 6 : 5));

      //the main grid only (not the small split-up ones): is this the crown's square? (level 7 only)
      if (
        level_7 &&
        total_width === width &&
        j * column_count + i === crown_cell
      ) {
        selector = -1;
        let pad = cell_size * 0.15;
        let crown_w = cell_size - pad * 2;
        let crown_h = cell_size * 0.5;
        let crown_y = y + cell_size * 0.25;
        simple_crown(
          x + pad,
          crown_y,
          crown_w,
          crown_h,
          5,
          map(movement, 0, 1, 0.2, 0.6),
        );
        targetObj = { x: x + pad, y: crown_y, w: crown_w, h: crown_h };
      }

      if (selector === 0) {
        let outer_radius = cell_size / 2 - 5;
        let points_count = [4, 6, 8, 10, 12, 14, 16, 18][floor(random(8))];
        star(
          x + cell_size / 2,
          y + cell_size / 2,
          outer_radius * movement,
          outer_radius,
          points_count,
          0,
        );
      }
      if (selector === 1) {
        let diameter = random(cell_size / 2, cell_size) * movement;
        circle(x + cell_size / 2, y + cell_size / 2, diameter);
      }
      if (selector === 2) {
        let points = [3, 5, 7, 9, 11, 13][floor(random(6))];
        double_crown(
          x,
          y,
          cell_size,
          cell_size,
          points,
          map(movement, 0, 1, 0.2, 0.8),
        );
      }
      if (selector === 3) {
        axe(x, y, cell_size, cell_size, map(movement, 0, 1, 0.2, 0.8));
      }
      if (selector === 4) {
        rhombus(x, y, cell_size, cell_size, random(0.4, 1) * movement);
      }
      if (selector === 5 && cell_size > 60) {
        surface_grid(x, y, 2, 2, cell_size); //splits this square into 4 smaller ones.
      }

      movement_offset += 1;
    }
  }
}

function star(x, y, inner_radius, outer_radius, points_count, start_angle) {
  let step = TWO_PI / points_count;
  beginShape();
  for (let i = 0; i < points_count; i++) {
    let angle = start_angle + step * i;
    vertex(x + cos(angle) * inner_radius, y + sin(angle) * inner_radius);
    vertex(
      x + cos(angle + step / 2) * outer_radius,
      y + sin(angle + step / 2) * outer_radius,
    );
  }
  endShape(CLOSE);
}

function simple_crown(
  x,
  y,
  shape_width,
  shape_height,
  points_count,
  points_height_ratio,
) {
  let points_height = shape_height * points_height_ratio;
  let points_spacing = shape_width / (points_count - 1);
  let point_x, point_y;
  beginShape();
  for (let i = 0; i < points_count; i++) {
    point_x = x + i * points_spacing;
    point_y = y;
    if (i % 2 != 0) {
      point_y = y + points_height;
    }
    vertex(point_x, point_y);
  }
  vertex(x + shape_width, point_y + shape_height);
  vertex(x, point_y + shape_height);
  endShape(CLOSE);
}

function double_crown(
  x,
  y,
  shape_width,
  shape_height,
  points_count,
  points_height_ratio,
) {
  let points_height = (shape_height * points_height_ratio) / 2;
  let points_spacing = shape_width / (points_count - 1);
  beginShape();
  for (let i = 0; i < points_count; i++) {
    let point_y = i % 2 !== 0 ? y + points_height : y;
    vertex(x + i * points_spacing, point_y);
  }
  for (let i = 0; i < points_count; i++) {
    let point_y =
      i % 2 !== 0 ? y + shape_height - points_height : y + shape_height;
    vertex(x + shape_width - i * points_spacing, point_y);
  }
  endShape(CLOSE);
}

function axe(x, y, shape_width, shape_height, prong_width_ratio) {
  let prong_width = (shape_width * prong_width_ratio) / 2;
  beginShape();
  vertex(x, y);
  vertex(x + prong_width, y + prong_width);
  vertex(x + prong_width, y);
  vertex(x + (shape_width - prong_width), y);
  vertex(x + (shape_width - prong_width), y + prong_width);
  vertex(x + shape_width, y);
  vertex(x + shape_width, y + shape_height);
  vertex(x + (shape_width - prong_width), y + (shape_height - prong_width));
  vertex(x + (shape_width - prong_width), y + shape_height);
  vertex(x + prong_width, y + shape_height);
  vertex(x + prong_width, y + (shape_height - prong_width));
  vertex(x, y + shape_height);
  endShape(CLOSE);
}

function rhombus(x, y, shape_width, shape_height, opening_ratio) {
  let opening_width = (shape_width * opening_ratio) / 2;
  beginShape();
  vertex(x + opening_width, y + shape_height / 2);
  vertex(x + shape_width / 2, y);
  vertex(x + (shape_width - opening_width), y + shape_height / 2);
  vertex(x + shape_width / 2, y + shape_height);
  endShape(CLOSE);
}
