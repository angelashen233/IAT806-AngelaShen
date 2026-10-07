console.log("Lab03-budgies-Starting-now");

//global variables, not local
let frames = []; // my 5 budgie frames
let sounds = []; // my budgie chirp or pixel sound of a jump
let bgMusic; // projects\iat-806\lab-03 copy\sounds\freesound_community-budgie-singing-69316.mp3
let PixelSound; // pixel effect-3, plays when the background changes color
let musicStarted = false; // becomes true after the first click starts the music

// the walking painters: one slot in each array per painter
let xs = [0, 100, 150, 200, 400];
let ys = [30, 80, 100, 230, 440];
let speeds = [2, 3, 1.5, 3, 4]; //will increase or decrease
let steps = [0, 0, 0, 0, 0]; // 5 frames, each painter's own frame counter, so one can freeze alone
let frozen = [false, false, false, false, false]; //whether a frame is frozen
let tints = []; //colorful budgies

// the larger budgie (real size) that changes pose on every click
let index = 0;
let soundIndex = 0;

let bgColor;
//let bgImag; in set up is good

// setup is called once at the start, draw loops every frame.
async function setup() {
  let canvas = createCanvas(700, 500);
  canvas.parent("sketch");
  bgImag = await loadImage("Images/Budgie-background-figma.png");
  noSmooth(); // keeps the pixel art crisp when it's scaled up

  // load the frames with a loop: Images/Budgie_0.png to Budgie_4.png
  for (let i = 0; i <= 4; i++) {
    // start from 0, to 4. 5 items.
    frames.push(await loadImage("Images/Budgie_" + i + ".png")); //load and wait
  }

  // load the sounds with a loop. MP3
  let soundFiles = [
    "freesound_community-budgie-chirps-47596.mp3",
    "freesound_community-pixel-sound-effect-3-82880.mp3",
    "freesound_community-pixel-sound-effect-4-82881.mp3",
    "freesound_community-budgie-singing-69316.mp3",
  ];
  for (let i = 0; i < soundFiles.length; i++) {
    sounds.push(await loadSound("sounds/" + soundFiles[i]));
  }

  // the background tune is a big file, so no await here: the painters start
  // right away and the music is ready a little later. bgMusic stays
  // undefined until then.
  loadSound("sounds/freesound_community-budgie-singing-69316.mp3").then(
    (song) => {
      bgMusic = song;
      bgMusic.amp(0.3); // quiet, so the click blips still stand out
      bgMusic.loop(); // in this p5.sound, loop() only turns repeat on, play() starts it
    },
  );

  // every starting painter gets plain colors (white tint = no change)
  for (let i = 0; i < xs.length; i++) {
    tints.push(color(255));
  }

  bgColor = color(80, 80, 80);

  // a button under the canvas that wipes away all the painters I added
  let clearButton = createButton("Clear budgies");
  clearButton.parent("sketch");
  clearButton.mousePressed(clearScreen);
}

// back to how it started: only the first 3 painters, yellow background
function clearScreen() {
  xs.splice(5);
  ys.splice(5);
  speeds.splice(5); //5 frames 5 speeds
  steps.splice(5);
  frozen.splice(5);
  tints.splice(5);
  bgColor = color(80, 80, 80);
  redraw(); // so it shows the cleared screen even while paused
}

function draw() {
  //constantly running
  background(bgColor);
  image(bgImag, 0, 0, 700, 500);
  // the big click painter sits in the middle, behind everyone else
  image(frames[index], 180, 140, 240, 320);

  for (let i = 0; i < xs.length; i++) {
    // a frozen painter doesn't walk or change pose, everyone else keeps going
    if (!frozen[i]) {
      //if not frozen
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
    image(frames[f], xs[i] - 50, ys[i] - 50, 80, 100);
    noTint();
  }

  fill(0);
  noStroke();
  text(
    "click: new budgie + sound   space: pause all   1/2/3: freeze one   up/down or w/s: speed",
    10,
    height - 10,
  );
}

function mousePressed() {
  // ignore clicks on the page that aren't on the canvas
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    return;
  }

  // big budgie goes to the next pose
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
  tints.push(color(random(50, 255), random(50, 255), random(50, 255)));

  // fun: disco background, a new color on every click
  // and the pixel effect-4 sound goes off with each new color
  bgColor = color(random(150, 255), random(150, 255), random(150, 255));
  PixelSound.play();
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
  if (
    key === "0" ||
    key === "1" ||
    key === "2" ||
    key === "3" ||
    key === "4" ||
    Key === "5"
  ) {
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
