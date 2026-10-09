console.log("Lab03-budgies-Starting-now");

//global variables, not local
let frames = []; // my 5 budgie frames
let sounds = []; // my budgie chirp or pixel sound of a jump
let bgMusic; // projects\iat-806\lab-03 copy\sounds\freesound_community-budgie-singing-69316.mp3
let PixelSound; // pixel effect-3, plays when the background changes color
let musicStarted = false; // becomes true after the first click starts the music
let muted = false; // the Mute button turns all sound off and on
let muteButton;

// the one budgie in the middle, flapping through its 5 frames
let step = 0; // counts up every frame, picks which pose to show
let speed = 1; // how fast the budgie animates, up/down changes it
let soundIndex = 0;

let numCols = 8;
// let numRos = 6;
let numRows = 6;
let colWidth;
let rowHeight;

let canvaWidth = 700;
let canvaHeight = 500;
let bgColor;
//let bgImag; in set up is good

let colors = [];
let speeds = [];

// let name = [
//   ["Alireza", "Karduni"],
//   ["Griffin", "Page"],
//   ["Afrooz", "GHadimi"],
// ];

// names [0][0] = "Ali;"

// setup is called once at the start, draw loops every frame.
async function setup() {
  let canvas = createCanvas(canvaWidth, canvaHeight);
  colWidth = width / numCols;
  rowHeight = height / numRows;

  for (let i = 0; i < numCols; i++) {
    colors[i] = [];
    speeds[i] = [];
    for (let j = 0; j < numRows; j++) {
      colors[i][j] = [random(1, 255), random(1, 255), random(1, 255)];
      speeds[i][j] = floor(random(5, 30)); // each budgie flaps at its own pace
    }
  }

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
  ];
  for (let i = 0; i < soundFiles.length; i++) {
    sounds.push(await loadSound("sounds/" + soundFiles[i]));
  }

  // its own copy of effect-3, so it can play at the same time as sounds[1]
  PixelSound = await loadSound(
    "sounds/freesound_community-pixel-sound-effect-3-82880.mp3",
  );

  // the background tune is a big file, so no await here: the budgie starts
  // right away and the music is ready a little later. bgMusic stays
  // undefined until then.
  loadSound("sounds/freesound_community-budgie-singing-69316.mp3").then(
    (song) => {
      bgMusic = song;
      bgMusic.amp(0.3); // quiet, so the click blips still stand out
      bgMusic.loop(); // in this p5.sound, loop() only turns repeat on, play() starts it
    },
  );

  bgColor = color(80, 80, 80);

  // a button under the canvas that turns all the sound off and on
  muteButton = createButton("Mute");
  muteButton.parent("sketch");
  muteButton.mousePressed(toggleMute);
}

// mute: stop the music and skip the click sounds; unmute: music comes back
function toggleMute() {
  muted = !muted;
  if (muted) {
    muteButton.html("Unmute");
    if (musicStarted) {
      bgMusic.pause();
    }
  } else {
    muteButton.html("Mute");
    // only restart the music if it was playing and the sketch isn't paused
    if (musicStarted && isLooping()) {
      bgMusic.play();
    }
  }
}

function draw() {
  //constantly running
  background(bgColor);
  image(bgImag, 0, 0, 700, 500);

  // rect(0, 0, colWidth, height);
  // switch pose every 15 steps so the budgie flaps back and forth
  step = step + speed;

  let f = floor(step / 15) % frames.length;

  image(frames[f], 180, 140, 240, 320);

  for (let col = 0; col < numCols; col++) {
    for (let row = 0; row < numRows; row++) {
      let c = colors[col][row];
      let w = map(mouseX, 0, width, 15, 80, true);
      let h = (w * 4) / 3;

      fill(c[0], c[1], c[2], 120); //random(60, 255)
      rect((col * colWidth) / 2, row * rowHeight, colWidth, rowHeight);
      animate(
        speeds[col][row],
        col * colWidth + 25,
        row * rowHeight + 20,
        30,
        40,
      );
    }
  }

  // row of budgies along the top
  // for (let x = 0; x < canvaWidth; x += 100) {
  //   for (let y = 0; y < canvaHeight; y += 100) {
  //     animate(10, x, y, 30, 40); // grid A
  //     animate(20, x + 50, y + 50, 30, 40); // grid B, shifted half a step
  //   }
  // }

  // column of budgies down the left side
  // for (let y = 0; y < canvaHeight; y += 100) {
  //   // animate(10, y, y, 30, 40);
  //   // animate(20, y + 80, y + 80, 30, 40);
  // }

  fill(0);
  noStroke();
  text(
    "click: sound + new color   space: pause   up/down or w/s: speed",
    10,
    height - 10,
  );
}

function mousePressed() {
  // ignore clicks on the page that aren't on the canvas
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    return;
  }

  // play the next sound, then wrap back to sounds[0] after the last one
  userStartAudio(); // browsers block sound until the user clicks; this switches it on

  // the music can't start on its own, so the first click starts it
  // (only once it has loaded, and not while paused with space)
  // (and not while muted)
  if (bgMusic && !musicStarted && isLooping() && !muted) {
    bgMusic.play();
    musicStarted = true;
  }

  if (!muted) {
    sounds[soundIndex].play();
  }
  soundIndex = (soundIndex + 1) % sounds.length;

  // fun: disco background, a new color on every click
  // and the pixel effect-4 sound goes off with each new color
  bgColor = color(random(150, 255), random(150, 255), random(150, 255));
  if (!muted) {
    PixelSound.play();
  }
}

function keyPressed() {
  // space pauses the whole animation, press again to start it
  if (key === " ") {
    // the music pauses and starts again along with the budgie
    if (isLooping()) {
      noLoop();
      if (musicStarted) {
        bgMusic.pause();
      }
    } else {
      loop();
      if (musicStarted && !muted) {
        bgMusic.play(); // picks up where it was paused (stays quiet if muted)
      }
    }
  }

  // fun: up arrow or w makes the budgie flap faster, down arrow or s slower
  // (in p5 2.x the arrow keys come through key as "ArrowUp" / "ArrowDown")
  if (key === "ArrowUp" || key === "w" || key === "W") {
    speed = speed * 1.5;
  }
  if (key === "ArrowDown" || key === "s" || key === "S") {
    speed = speed / 1.5;
  }

  // stops the space bar from scrolling the page
  return false;
}

//class lesson function

//function are collection of code, that simplifys code.

function animate(speed, xPosition, yPosition, imageWidth, imageHeight) {
  let slowFrame = floor(frameCount / speed);
  let index = slowFrame % frames.length;
  let currentFrame = frames[index];
  let origWidth = currentFrame.width;
  let origHeight = currentFrame.height;

  // only width given? work out the height so the budgie keeps its shape
  if (imageWidth && !imageHeight) {
    let ratio = imageWidth / origWidth;
    imageHeight = origHeight * ratio;
  }

  image(currentFrame, xPosition, yPosition, imageWidth, imageHeight);
}

//learning complexity of function
// function getFrameIndex(speed) {
//   let slowFrame = Math.floor(frameCount / speed);
//   let index = slowFrame % frames.length;
//   return index; // very very VERY important to return, other wise will be undefined.
// }
