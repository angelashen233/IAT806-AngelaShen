console.log("Lab03");

//global variables
let frames = []; // my two painting poses
let sounds = []; // my 8-bit blips
let bgMusic; // StockTune "Butterfly Waltz", loops under everything
let discoSound; // pixel effect-4, plays when the background changes color
let musicStarted = false; // becomes true after the first click starts the music

// the walking painters: one slot in each array per painter
let xs = [0, 200, 400];
let ys = [30, 230, 440];
let speeds = [2, 3, 1.5];
let steps = [0, 0, 0]; // each painter's own frame counter, so one can freeze alone
let frozen = [false, false, false];
let tints = [];

// the big painter that changes pose on every click
let index = 0;
let soundIndex = 0;

let bgColor;

// setup is called once at the start, draw loops every frame.
async function setup() {
  let canvas = createCanvas(600, 600);
  canvas.parent("sketch");
  noSmooth(); // keeps the pixel art crisp when it's scaled up

  // load the frames with a loop: angela_8bit_painting_motion_1.png, _2.png
  for (let i = 1; i <= 2; i++) {
    frames.push(await loadImage("angela_8bit_painting_motion_" + i + ".png"));
  }

  // load the sounds with a loop. They aren't all the same type,
  // sound1.mp3 is "pixel sound effect 4" by freesound_community
  let soundFiles = ["sound0.wav", "sound1.mp3", "sound2.wav", "sound3.wav"];
  for (let i = 0; i < soundFiles.length; i++) {
    sounds.push(await loadSound("sounds/" + soundFiles[i]));
  }

  // the background tune is a big file, so no await here: the painters start
  // right away and the music is ready a little later. bgMusic stays
  // undefined until then.
  loadSound("sounds/bg-music.mp3").then((song) => {
    bgMusic = song;
    bgMusic.amp(0.3); // quiet, so the click blips still stand out
    bgMusic.loop(); // in this p5.sound, loop() only turns repeat on, play() starts it
  });

  // its own copy of effect-4, so it can play at the same time as sounds[1]
  discoSound = await loadSound("sounds/sound1.mp3");

  // every starting painter gets plain colors (white tint = no change)
  for (let i = 0; i < xs.length; i++) {
    tints.push(color(255));
  }

  bgColor = color(255, 255, 60);

  // a button under the canvas that wipes away all the painters I added
  let clearButton = createButton("Clear screen");
  clearButton.parent("sketch");
  clearButton.mousePressed(clearScreen);
}

// back to how it started: only the first 3 painters, yellow background
function clearScreen() {
  xs.splice(3);
  ys.splice(3);
  speeds.splice(3);
  steps.splice(3);
  frozen.splice(3);
  tints.splice(3);
  bgColor = color(255, 255, 60);
  redraw(); // so it shows the cleared screen even while paused
}

function draw() {
  //constantly running
  background(bgColor);

  // the big click painter sits in the middle, behind everyone else
  image(frames[index], 180, 140, 240, 320);

  for (let i = 0; i < xs.length; i++) {
    // a frozen painter doesn't walk or change pose, everyone else keeps going
    if (!frozen[i]) {
      xs[i] = xs[i] + speeds[i];
      steps[i] = steps[i] + 1;
    }

    // walked off the right side, so come back in from the left
    if (xs[i] > width) {
      xs[i] = -96;
    }

    // switch pose every 15 steps so the brush goes back and forth
    let f = floor(steps[i] / 15) % frames.length;
    tint(tints[i]);
    image(frames[f], xs[i], ys[i]);
    noTint();
  }

  fill(0);
  noStroke();
  text(
    "click: new painter + sound   space: pause all   1/2/3: freeze one   up/down or w/s: speed",
    10,
    height - 10,
  );
}

function mousePressed() {
  // ignore clicks on the page that aren't on the canvas
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    return;
  }

  // big painter goes to the next pose
  index = (index + 1) % frames.length;

  // play the next sound, then wrap back to sounds[0] after the last one
  userStartAudio(); // browsers block sound until the user clicks; this switches it on

  // the music can't start on its own, so the first click starts it
  // (only once it has loaded, and not while paused with space)
  if (bgMusic && !musicStarted && isLooping()) {
    bgMusic.play();
    musicStarted = true;
  }

  sounds[soundIndex].play();
  soundIndex = (soundIndex + 1) % sounds.length;

  // fun: a new painter in a random color shows up where I clicked
  xs.push(mouseX - 48);
  ys.push(mouseY - 64);
  speeds.push(random(1, 4));
  steps.push(0);
  frozen.push(false);
  tints.push(color(random(255), random(255), random(255)));

  // fun: disco background, a new color on every click
  // and the pixel effect-4 sound goes off with each new color
  bgColor = color(random(150, 255), random(150, 255), random(150, 255));
  discoSound.play();
}

function keyPressed() {
  // space pauses the whole animation, press again to start it
  if (key === " ") {
    // the music pauses and starts again along with the dancers
    if (isLooping()) {
      noLoop();
      if (musicStarted) {
        bgMusic.pause();
      }
    } else {
      loop();
      if (musicStarted) {
        bgMusic.play(); // picks up where it was paused
      }
    }
  }

  // bonus: 1, 2 or 3 freezes just that one painter (press again to unfreeze)
  if (key === "1" || key === "2" || key === "3") {
    let i = int(key) - 1;
    frozen[i] = !frozen[i];
  }

  // fun: up arrow or w makes everyone walk faster, down arrow or s slower
  // (in p5 2.x the arrow keys come through key as "ArrowUp" / "ArrowDown")
  if (key === "ArrowUp" || key === "w" || key === "W") {
    for (let i = 0; i < speeds.length; i++) {
      speeds[i] = speeds[i] * 1.5;
    }
  }
  if (key === "ArrowDown" || key === "s" || key === "S") {
    for (let i = 0; i < speeds.length; i++) {
      speeds[i] = speeds[i] / 1.5;
    }
  }

  // stops the space bar from scrolling the page
  return false;
}
