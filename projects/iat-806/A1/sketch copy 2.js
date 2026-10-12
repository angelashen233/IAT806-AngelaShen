// An example sketch, so the page has something to show.
// MAJOR CREDIT: https://openprocessing.org/@guilhermesv/2225777#code
//I am making it my own by changing it so that it's interactive.
//Along with making the sketch different.

//adding mouse distance for interaction

//let mouse_distance = dist(mouseX, mouseY, x + cell_size / 2);
//let movement = constrain(map(mouse_distance, 0, cell_size * 2, 1, 0), 0, 1);
//sine_scale is a big thing for the sketch to be moveable.

let bgcolor = "#181816";
let linecolor = "#e4e4e4";
let color_options = [
  "#8188d4",
  "#e87171",
  "#90ee80",
  "#d881af",
  "#463215",
  "#e4db8a",
];

let sine_scale = 0.01; //fixed: renamed from shapes_speed, grid() uses sine_scale.
let grid_column_count;
let grid_row_count;
let seed;
let auto_on = false; //added: true = shapes pulse by themselves, false = only the mouse moves them. starts off.
let time = 0; //added: my own clock for the pulse, it only goes up while auto_on is true.

let all_off = false; //added: true = O was pressed, shapes stay still and ignore the mouse.
let level_1 = true;
let level_2 = false;
let level_3 = false;
let level_4 = false;
let level_5 = false;

let timer = 0; //added: how many seconds it took to find all the shapes. stays 0 until level 5.
let start_time = 0; //added: millis() when the game started, set at the end of setup().
let best_time = null; //added: fastest time ever, loaded from the browser in setup(). null = never finished yet.

let target_cell; //added: which square the click-me shape goes in. renamed from crown_cell since every level has one now.
let target_box = null; //added: where the click-me shape was drawn this frame {x, y, w, h}, so mousePressed() can check if it was clicked.
//added: the bottom right text for each level, [0] is level 1. change these to whatever you want.

let level_names = [
  "LEVEL 1 - just find the crown.",
  "LEVEL 2 - continue this, you can do it.",
  "LEVEL 3 - Is your eyes okay?",
  "LEVEL 4 - Can you beat a record?",
  "LEVEL 5 - you made it!",
];
//added: the title for each level, telling you which shape to click. [0] is level 1, same as level_names.
let level_titles = [
  "Click the crown (zig-zag on top only).",
  "Click the double crown (zig-zag on top AND bottom).",
  "Click the axe (square with notches cut into the corners).",
  "Click the diamond.",
  "You found them all!",
];

//added: turns the level booleans into a number 1-5, so it's easier to check which level we're on.
function current_level() {
  if (level_1) return 1;
  if (level_2) return 2;
  if (level_3) return 3;
  if (level_4) return 4;
  return 5;
}

//added: moves one level up, turns the old level off and the next one on.
function next_level() {
  if (level_1) {
    level_1 = false;
    level_2 = true;
  } else if (level_2) {
    level_2 = false;
    level_3 = true;
  } else if (level_3) {
    level_3 = false;
    level_4 = true;
  } else if (level_4) {
    level_4 = false;
    level_5 = true;
    //added: found the last shape, so stop the clock. millis() is in milliseconds, / 1000 = seconds.
    timer = (millis() - start_time) / 1000;
    //added: save it if it's the first finish or faster than the old record.
    if (best_time === null || timer < best_time) {
      best_time = timer;
      storeItem("best_time", best_time); //saves in the browser, so it's still there after a reload.
    }
  }
  target_cell = floor(random(grid_column_count * grid_row_count)); //new level = the shape moves to a new square.
}

function print_text(x, y, text_input) {
  push(); //fixed: push/pop keeps these text settings from changing the grid's colours and lines.
  //fixed: removed rectMode(LEFT), LEFT isn't a rectMode (it's for textAlign) so it did nothing.
  noStroke(); //fixed: the grid's stroke and glow were drawing over the letters.
  drawingContext.shadowBlur = 0;
  fill(0); //fixed: black text, before it used whatever colour the last shape was.
  textSize(20);
  let s = text_input; //fixed: no quotes, "text_input" in quotes printed the word text_input, not what you passed in.
  text(s, x, y, 300, 200); //fixed: the box was 70 x 80, too small so the words got cut off.
  pop();
  //fixed: removed describe(), it replaced the grid description from setup() with the fox one.
}

function setup() {
  const canvas = createCanvas(sketch_holder_width(), windowHeight); //fixed: same width as the sketch-holder div, not the whole window.
  //strokeJoin(SQUARE);

  // Puts the canvas inside the <div id="sketch-holder"> in index.html, // done
  // instead of dropping it at the bottom of the page.
  grid_column_count = floor(random(3, 5));

  fit_canvas_to_grid(); //fixed: works out the rows and makes the canvas height fit them exactly.
  target_cell = floor(random(grid_column_count * grid_row_count)); //added: a random square number for the click-me shape.

  seed = random(500); //remove flikering
  //fixed: moved grid() into draw(), background() was painting over it.

  describe(
    "Drawing a grid of squares with a gemotriy within that varies from simple shapes to more complex ones.",
  );
  canvas.parent("sketch-holder");

  //fixed: removed update_row_count(), it only exists in pattern.sketch.js. fit_canvas_to_grid() does the rows now.

  best_time = getItem("best_time"); //added: loads the saved record, gives null if there isn't one yet.
  start_time = millis(); //added: start the clock.
}

//fixed: the div is narrower than the window (style.css takes 2.5rem off), so a windowWidth canvas got squished to fit.
function sketch_holder_width() {
  return document.getElementById("sketch-holder").clientWidth;
}

//fixed: ceil() added a part row that got cut off at the bottom, so now the canvas height = rows * cell size.
function fit_canvas_to_grid() {
  let cell_size = width / grid_column_count;
  //most amount of rows come from the numner of random columns.
  grid_row_count = ceil(windowHeight / cell_size);
  resizeCanvas(width, grid_row_count * cell_size);
}

//fixed: p5 calls this when the window changes size, so the grid still fits after resizing.
function windowResized() {
  resizeCanvas(sketch_holder_width(), height);
  fit_canvas_to_grid();
}

function draw() {
  //mouse changes
  sine_scale = map(mouseX, 0, width, 0.001, 0.05);
  //added: the clock only moves when auto is on, so the pulse pauses when it's off.
  //adding a little each frame (not frameCount * speed) also stops the shapes jumping when the speed changes.
  if (auto_on) {
    time += sine_scale;
  }

  background(240);
  randomSeed(seed);
  target_box = null; //added: forget last frame's click-me shape, grid() saves it again if it gets drawn.
  //fixed: took out the example circles and draw the grid every frame instead.
  grid(0, 0, grid_column_count, grid_row_count, width);

  print_text(0, 0, "PRESS O to stop auto/mouse-movements");
  //added: replaced "Open the flower." with a title that changes each level and says which shape to click.
  //y = 60 so it sits under the PRESS O text instead of on top of it.
  print_text(0, 60, level_titles[current_level() - 1]);
  print_text(width - 300, height - 100, level_names[current_level() - 1]); //added: - 1 because lists start at 0.

  //added: shows the time under the level name. nf(number, 0, 1) = 1 number after the dot, like 12.3.
  let time_text;
  if (level_5) {
    time_text = "Your time: " + nf(timer, 0, 1) + "s"; //finished, so the time stops here.
  } else {
    time_text = "Time: " + nf((millis() - start_time) / 1000, 0, 1) + "s"; //still playing, counts up.
  }
  if (best_time !== null) {
    time_text += "   Best: " + nf(best_time, 0, 1) + "s";
  }
  print_text(width - 300, height - 60, time_text);
}

//added: p5 calls this every time the mouse is clicked.
function mousePressed() {
  //added: clicking inside the click-me shape moves up a level. return stops it also flipping auto below.
  //no level_1 check anymore, target_box is only saved on levels 1-4, so level 5 can't go further.
  if (
    target_box &&
    mouseX >= target_box.x &&
    mouseX <= target_box.x + target_box.w &&
    mouseY >= target_box.y &&
    mouseY <= target_box.y + target_box.h
  ) {
    next_level();
    return;
  }

  //only count clicks on the canvas, so clicking the menu links doesn't flip it.
  //added: !all_off so clicking does nothing while O has everything turned off.
  if (
    !all_off &&
    mouseX >= 0 &&
    mouseX <= width &&
    mouseY >= 0 &&
    mouseY <= height
  ) {
    auto_on = !auto_on; //! flips it: true becomes false, false becomes true.
  }
}

//added: p5 calls this every time a key is pressed.
function keyPressed() {
  //key is the letter pressed, checking both so caps lock doesn't matter.
  if (key === "o" || key === "O") {
    all_off = !all_off; //press O again to turn the mouse back on.
    auto_on = false; //turns auto off too, click to turn it back on after.
  }
}

function grid(x_start, y_start, column_count, row_count, total_width) {
  stroke(linecolor);
  strokeWeight(random(1, 3));
  drawingContext.shadowBlur = 5; //how fuzzy, bigger = softer.
  drawingContext.shadowColor = linecolor; //colour of the fuzz.

  let cell_size = total_width / column_count;

  let movement_offset = 0;

  for (let j = 0; j < row_count; j++) {
    for (let i = 0; i < column_count; i++) {
      let x = x_start + i * cell_size;
      let y = y_start + j * cell_size;

      let mouse_distance = dist(
        mouseX,
        mouseY,
        x + cell_size / 2,
        y + cell_size / 2,
      ); //fixed: added y + cell_size / 2, dist needs 4 numbers or it gives NaN.

      //pick a random position in the areas.
      let color_index = floor(random(color_options.length - 1));

      fill(color_options[color_index]);
      rect(x, y, cell_size, cell_size);
      fill(color_options[(color_index + 1) % color_options.length]);

      //fixed: put the sine wave back as pulse, frameCount goes up by itself so this keeps moving on its own.
      let pulse = map(
        sin(time + movement_offset), //added: uses my time clock instead of frameCount * sine_scale.
        -1,
        1,
        0,
        1,
      );

      //close to the mouse = 1, far away = 0.
      let closeness = constrain(
        map(mouse_distance, 0, cell_size * 2, 1, 0),
        0,
        1,
      );

      //fixed: mixes both, far shapes still pulse (0.3) and shapes near the mouse pulse bigger (1).
      let movement;

      //VERY IMPORTANT

      if (all_off) {
        movement = 0.5; //added: O is on, so every shape stays still at half way. (1 makes the stars lose their points)
      } else if (auto_on) {
        movement = pulse * map(closeness, 0, 1, 0.3, 1);
      } else {
        movement = map(closeness, 0, 1, 0.3, 1); //fixed: was just closeness, so far away = 0 and circles shrank to nothing. now the smallest is 0.3.
      }

      //fixed: was random(6 + 3), so 6, 7 and 8 drew nothing and almost half the squares were empty.
      //now 0-4 are shapes and 5 (split into 4) only if the cell is big enough to split.
      let selector = floor(random(cell_size > 60 ? 6 : 5));

      //added: total_width === width means this is the main grid, not a small split-up one.
      //j * column_count + i numbers the squares 0, 1, 2... left to right, top to bottom.
      //added: level 5 is the last one, so no click-me shape there.
      if (
        !level_5 &&
        total_width === width &&
        j * column_count + i === target_cell
      ) {
        selector = -1; //no other shape in this square.
        draw_target(x, y, cell_size, movement);
      }

      if (selector === 0) {
        let outer_radius = cell_size / 2 - 5; //fixed: / 2 not / 1, so the star fits in the cell.
        let inner_radius = outer_radius * movement; //fixed: out_radius -> outer_radius.
        let points_count = [4, 6, 8, 10, 12, 14, 16, 18][floor(random() * 8)];
        //making a star in the areas of grid.
        star(
          x + cell_size / 2, //use mouse
          y + cell_size / 2,
          inner_radius,
          outer_radius,
          points_count,
          0,
        );
      }
      //end of a section

      if (selector === 1) {
        let diameter = random(cell_size / 2, cell_size) * movement;
        circle(x + cell_size / 2, y + cell_size / 2, diameter);
      }

      if (selector === 2) {
        let points = [3, 5, 7, 9, 11, 13][floor(random(6))]; //fixed: added 11 back, random(6) needs 6 items.
        let points_height = map(movement, 0, 1, 0.2, 0.8);
        //added: moved the level check here from inside double_crown(), so level 2 can still use it as its click-me shape.
        if (level_3) {
          double_crown(x, y, cell_size, cell_size, points, points_height);
        }
      }
      //end of circle and double crown

      if (selector === 3) {
        let prong_width = map(movement, 0, 1, 0.2, 0.8); //fixed: 0, 2 -> 0.2 (comma was a typo).
        //added: moved the level check here from inside axe(), so level 3 can still use it as its click-me shape.
        if (level_1) {
          axe(x, y, cell_size, cell_size, prong_width);
        }
      }
      //end of prong

      if (selector == 4) {
        let opening_width = random(0.4, 1) * movement;
        //added: moved the level check here from inside rhombus(), so level 4 can still use it as its click-me shape.
        if (level_2) {
          rhombus(x, y, cell_size, cell_size, opening_width); //fixed: rhmbus -> rhombus.
        }
      }

      if (selector === 5 && cell_size > 60) {
        //fixed: > not <, so big cells split into 2x2 and it stops once they're small.
        grid(x, y, 2, 2, cell_size);
      }

      movement_offset += 1; //to shifts adding on variable
    }
  }
}

//added: draws this level's click-me shape in the middle of its square and saves where it is in target_box.
//each one is a shape the other squares don't have on that level, so it's the odd one out.
function draw_target(x, y, cell_size, movement) {
  let pad = cell_size * 0.15; //gap so the shape doesn't touch the square's edges.
  let size = cell_size - pad * 2;
  let box_x = x + pad;
  let box_y = y + pad;

  if (level_1) {
    //level 1: simple crown -> level 2.
    box_y = y + cell_size * 0.25; //the crown is only half as tall, so 0.25 down sits it in the middle.
    simple_crown(
      box_x,
      box_y,
      size,
      cell_size * 0.5,
      5,
      map(movement, 0, 1, 0.2, 0.6),
    );
    target_box = { x: box_x, y: box_y, w: size, h: cell_size * 0.5 };
    return;
  }
  if (level_2) {
    //level 2: double crown -> level 3.
    double_crown(box_x, box_y, size, size, 5, map(movement, 0, 1, 0.2, 0.8));
  } else if (level_3) {
    //level 3: axe -> level 4.
    axe(box_x, box_y, size, size, map(movement, 0, 1, 0.2, 0.8));
  } else if (level_4) {
    //level 4: rhombus -> level 5.
    rhombus(box_x, box_y, size, size, 0.5 * movement);
  }
  target_box = { x: box_x, y: box_y, w: size, h: size }; //saved for mousePressed().
}

//drawing a shapeImageThreshold:
function star(x, y, inner_radius, outer_radius, points_count, start_angle) {
  //fixed: outter_radius -> outer_radius.
  let step = TWO_PI / points_count;

  beginShape();
  for (let i = 0; i < points_count; i++) {
    //fixed: added let to i, angle and the x/y's.
    let angle = start_angle + step * i;

    let inner_x = x + cos(angle) * inner_radius;
    let inner_y = y + sin(angle) * inner_radius; //fixed: sin(angle) * radius, not sin(angle * radius).
    vertex(inner_x, inner_y);
    //fixed: added the outer point, half a step further round = the tip of the star.
    let outer_x = x + cos(angle + step / 2) * outer_radius;
    let outer_y = y + sin(angle + step / 2) * outer_radius;
    vertex(outer_x, outer_y);
  }
  endShape(CLOSE); //close joins the last corner back to the first.
}

//draws a crow with the sig-sag points

function simple_crown(
  x,
  y,
  shape_width,
  shape_height,
  points_count,
  points_height_ratio, //fixed: hegiht -> height.
) {
  //added: removed if (level_1 == true), draw_target() already only draws this on level 1.
  let points_height = shape_height * points_height_ratio;
  let points_spacing = shape_width / (points_count - 1); //space between points
  let point_x, point_y; //declared 2 variables at once.

  beginShape();
  for (let i = 0; i < points_count; i++) {
    //fixed: added let to i, and points_x/points_y -> point_x/point_y to match above.
    point_x = x + i * points_spacing;
    point_y = y;
    //i % is 0 for even numbres and 1 for odd ones, so every other points drops down = zig - zag.
    if (i % 2 != 0) {
      point_y = y + points_height;
    }
    vertex(point_x, point_y);
  }
  vertex(x + shape_width, point_y + shape_height);
  vertex(x, point_y + shape_height);
  endShape(CLOSE);
  //fixed: removed if (mousePressed), mousePressed is the click function so it was always true.
  //the click check is in mousePressed() now, using target_box.
}

function axe(x, y, shape_width, shape_height, prong_width_ratio) {
  //added: removed if (level_1 == true), the level check is in grid() now.
  let prong_width = (shape_width * prong_width_ratio) / 2; //fixed: widith -> width.
  beginShape(); //fixed: begin_Shape -> beginShape.
  // 13 corners each listed in ordero f clockwise. refencng the demo.
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

//axe completec

//last shapeImageThreshold:

function rhombus(x, y, shape_width, shape_height, opening_ratio) {
  //added: removed if (level_2 == true), the level check is in grid() now.
  let opening_width = (shape_width * opening_ratio) / 2;
  beginShape();
  // 4corners : left top, right, bottom.
  vertex(x + opening_width, y + shape_height / 2);
  vertex(x + shape_width / 2, y);
  vertex(x + (shape_width - opening_width), y + shape_height / 2);
  vertex(x + shape_width / 2, y + shape_height);
  endShape(CLOSE);
}

//Start double crown shape function.

function double_crown(
  x,
  y,
  shape_width,
  shape_height,
  points_count,
  points_height_ratio,
) {
  //added: removed if (level_3 == true), the level check is in grid() now.
  let points_height = (shape_height * points_height_ratio) / 2;
  let points_spacing = shape_width / (points_count - 1);
  beginShape();

  for (let i = 0; i < points_count; i++) {
    //I updated to use let instead of Var.
    let point_x = x + i * points_spacing; //fixed: points_x -> point_x.
    let point_y = y;
    if (i % 2 !== 0) {
      point_y = y + points_height; //fixed: points_y -> point_y.
    }
    vertex(point_x, point_y); //fixed: moved inside the loop so every point gets drawn.
  }

  for (let i = 0; i < points_count; i++) {
    let point_x = x + shape_width - i * points_spacing; //fixed: shapes_width -> shape_width.
    let point_y = y + shape_height;
    if (i % 2 !== 0) {
      point_y = y + shape_height - points_height;
    }
    vertex(point_x, point_y);
  }
  endShape(CLOSE);
}

//end of double crown
