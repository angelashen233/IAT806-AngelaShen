// lab 06: a full screen of pulsing balls that react to your body and your hands.
// - each ball sits in its own spot on a grid, wobbles around it a little, and pulses 5 pixels bigger and smaller.
// - the webcam finds your body, and the balls on top of you turn red. click a ball to turn it red too.
// - *change* hand gesture recognition: teach it letters from the ASL alphabet (fingerspelling),
//   then it shows which letter your hand is making.
// - *change* compliments: an on-screen guide shows 4 hand gestures. teach them with the number keys 1 to 4,
//   and when it sees one, it shows that gesture's compliment sentence.
// - *change* smaller balls, and steadier tracking (smoothed hand points, a steadier guess, a smoother body outline).
//
// REFERENCES
// body segmentation: ml5.js example "bodySegmentation-mask-person", https://editor.p5js.org/ml5/sketches/h6TN8umP5
// *change* hand tracking and the sign classifier: ml5.js handPose and neuralNetwork, https://ml5js.org/
// ml5.js license and Code of Conduct: https://github.com/ml5js/ml5-next-gen/blob/main/LICENSE.md

//settings: change these to see what happens.
let spacing = 20; //how many pixels apart the balls' spots are. smaller = more balls (but slower: 16 dropped to ~10 fps).
//*change* smaller balls: pulse and wander were 5 and 4, with a radius of 8 to 14 (see makeBalls()).
let pulseAmount = 2; //how many pixels bigger and smaller each ball gets as it pulses.
let wander = 2; //how many pixels a ball can drift away from its spot.
let minRadius = 3; //*change* the smallest and biggest a ball can be (its radius, before pulsing).
let maxRadius = 6;

let myBalls = [];

//the pause button: stops the pulsing and the wobbling, press again to start them.
let paused = false;
let pauseButton;
let pulseTime = 0; //the pulse clock. it only counts up while not paused, so the balls freeze mid-pulse.

//body segmentation
let bodySegmentation;
let video;
let segmentation;

let options = {
  //with "person", ml5 makes the person see-through and the room solid in the mask.
  maskType: "person",
};

//*change* hand gesture recognition
let handPose; //the hand tracking model. finds 21 points on your hand: wrist, knuckles, fingertips.
let hands = []; //the hands it found in the latest camera frame.
let signModel; //a small neural network that learns which hand shape is which letter.
let sampleCounts = {}; //how many examples you've saved for each letter, like { A: 60, B: 55 }.
let trainingRounds = 100; //how many times it practises on your examples. more = slower but often better. //*fix* was 50, too few for a real (wobbly) hand
let warning = ""; //*fix* a message for when something didn't work, like pressing Enter with only 1 sign saved.
let trainingRound = 0; //which round it's on while training.
let modelState = "collecting"; //"collecting" (saving examples), "training", or "ready" (recognising).
let prediction = null; //its latest guess, like { label: "A", confidence: 0.93 }.
let classifying = false; //true while it's busy guessing, so it doesn't start a second guess on top.

//*change* steadier tracking
let smoothHand = null; //the hand's 21 points, averaged over the last few frames so they don't jitter.
let handSmoothing = 0.5; //0 to 1: how much each new frame moves the points. lower = steadier but slower to follow.
let minHandConfidence = 0.6; //ignore a hand the tracker is less sure about than this (0 to 1).
let recentGuesses = []; //the last few guesses, so one odd frame can't change what's shown.
let guessesToKeep = 8; //how many recent guesses it looks at.
let shownGuess = null; //the guess on screen: only changes when most of the recent guesses agree.

//*change* compliments: each gesture has a number key (to teach it), what it looks like, and the sentence it makes.
//they use number keys, so the letters A to Z stay free for fingerspelling.
//the "I love you" hand is an ASL sign; the others are everyday gestures, not ASL signs.
//gestures mean different things in different places, so the guide says what each one means here.
let compliments = [
  {
    key: "1",
    emoji: "\u{1F91F}",
    name: '"I love you" hand (ASL)',
    how: "thumb, index finger and pinky up; middle and ring fingers folded down",
    sentence: "I love you, you mean so much to me!",
  },
  {
    key: "2",
    emoji: "\u{1F44D}",
    name: "thumbs up",
    how: "make a fist with your thumb pointing up",
    sentence: "Great job, you did amazing!",
  },
  {
    key: "3",
    emoji: "\u{270B}",
    name: "open hand (high five)",
    how: "all five fingers spread, palm facing the camera",
    sentence: "High five, you're awesome!",
  },
  {
    key: "4",
    emoji: "\u{270C}\u{FE0F}",
    name: "peace sign",
    how: "index and middle fingers up in a V, the others folded down",
    sentence: "You bring such good energy!",
  },
];
let complimentConfidence = 0.6; //how sure it has to be (0 to 1) before it shows a compliment. //*fix* was 0.8, which a real hand often never reached

function setup() {
  const canvas = createCanvas(sketch_holder_width(), windowHeight); //full width of the page, full height of the window.

  // Puts the canvas inside the <div id="sketch-holder"> in index.html,
  // instead of dropping it at the bottom of the page.
  canvas.parent("sketch-holder");

  //the button sits on top of the canvas's top-left corner, so it's on screen even though the canvas fills the window.
  select("#sketch-holder").style("position", "relative"); //makes position() below measure from the holder's corner.
  pauseButton = createButton("Pause");
  pauseButton.parent("sketch-holder");
  pauseButton.position(16, 16);
  pauseButton.mousePressed(togglePause);

  makeBalls();
  newSignModel(); //*change*

  //no await here: setup() finishes right away, so the balls start straight away.
  //(in p5 2.x, an async setup() makes draw() wait for the whole model download.)
  startCamera();
}

//turns on the camera, then loads the models and starts them watching it.
async function startCamera() {
  video = createCapture(VIDEO);
  video.hide(); //draw() draws it instead, scaled to fill the canvas.

  bodySegmentation = await ml5.bodySegmentation("SelfieSegmentation", options);
  bodySegmentation.detectStart(video, gotResults);

  //*change* hand tracking, on the same camera. one hand is enough for fingerspelling.
  handPose = await ml5.handPose({ maxHands: 1 });
  handPose.detectStart(video, gotHands);
}

// how wide the sketch-holder div is, in pixels
function sketch_holder_width() {
  return document.getElementById("sketch-holder").clientWidth;
}

// keeps the canvas full size when the window changes size, and fills the new space with balls.
function windowResized() {
  resizeCanvas(sketch_holder_width(), windowHeight);
  makeBalls();
}

//a random colour somewhere between blue and purple.
function bluePurple() {
  let blue = color(40, 90, 230);
  let purple = color(150, 60, 220);
  return lerpColor(blue, purple, random(1)); //random(1) = how far along from blue to purple, 0 to 1.
}

//fills the whole canvas with balls, one every spacing pixels across and down.
function makeBalls() {
  myBalls = [];
  for (let x = spacing / 2; x < width; x += spacing) {
    for (let y = spacing / 2; y < height; y += spacing) {
      myBalls.push(new Ball(x, y, random(minRadius, maxRadius), bluePurple())); //put smth inside of the array
    }
  }
}

//how much the video is scaled up and where it starts, so it covers the canvas without squishing.
//whichever side needs to grow more decides how much, and the extra is cut off the edges.
//the video, the balls and the hand points all use this, so they line up.
function videoFit() {
  let scale = max(width / video.width, height / video.height);
  let offsetX = (width - video.width * scale) / 2;
  let offsetY = (height - video.height * scale) / 2;
  return { scale: scale, offsetX: offsetX, offsetY: offsetY };
}

//order: the masked video first, then the balls on top of it, then the hand and the sign text on top of everything.
function draw() {
  //background(0);

  if (!paused) {
    pulseTime += 1;
  }

  let fit;
  if (segmentation) {
    fit = videoFit();
    segmentation.mask.loadPixels(); //once per frame, so every ball can read the mask quickly.
    video.mask(segmentation.mask);
    image(
      video,
      fit.offsetX,
      fit.offsetY,
      video.width * fit.scale,
      video.height * fit.scale,
    );
  }

  for (let ball of myBalls) {
    if (segmentation) {
      ball.onBody = ball.isOnBody(
        segmentation.mask,
        fit.scale,
        fit.offsetX,
        fit.offsetY,
      );
    }
    if (!paused) {
      ball.move();
    }
    ball.update(); //every frame, the ball checks if it's clicked or on the person, and picks its colour.
    ball.show();
  }

  //*change* hand gesture recognition
  collectSample();
  guessSign();
  drawHand();
  drawSignPanel();
}

// callback function for body segmentation: ml5 calls this with each new mask.
function gotResults(result) {
  segmentation = result;
}

//pause: everything freezes where it is. play: it carries on from there.
function togglePause() {
  paused = !paused;
  if (paused) {
    pauseButton.html("Play");
  } else {
    pauseButton.html("Pause");
  }
}

//click a ball to turn it red. click it again to turn it back.
function mousePressed(event) {
  //clicks on the pause button come here too. this skips them, so the ball under the button doesn't turn red.
  if (event && event.target === pauseButton.elt) {
    return;
  }

  //forEach runs the code inside { } once for every ball in the array, calling it "ball" each time.
  myBalls.forEach((ball) => {
    if (ball.contains(mouseX, mouseY)) {
      ball.clicked = !ball.clicked; //flips it: not clicked -> clicked, clicked -> not clicked.
    }
  });
}

// ---------------------------------------------------------------------------
// *change* HAND GESTURE RECOGNITION (ASL fingerspelling practice)
// how to use it:
// 1. make a letter's hand shape, and HOLD that letter's key on the keyboard. it saves an example every frame.
//    move your hand around a bit while you hold it, so it learns the shape from different angles.
//    aim for about 50+ examples per letter, and at least 2 letters.
// 2. press Enter to train. it practises on your examples (you'll see the rounds count up).
// 3. make a hand shape: it shows which letter it thinks it is, and how sure it is.
// press Backspace to forget everything and start again.
// tip: use the same hand the whole time. a left hand and a right hand make mirror-image shapes.
// ---------------------------------------------------------------------------

//*change* ml5 calls this with the hands it found in each new camera frame.
//*change* steadier tracking: skips hands it's unsure about, and averages the points over a few frames.
function gotHands(results) {
  hands = results.filter((hand) => hand.confidence === undefined || hand.confidence >= minHandConfidence);

  if (hands.length === 0) {
    smoothHand = null;
    return;
  }

  let newPoints = hands[0].keypoints;
  if (smoothHand === null) {
    smoothHand = { keypoints: newPoints.map((point) => ({ x: point.x, y: point.y })) };
    return;
  }
  //lerp moves each smoothed point part of the way (handSmoothing) towards where the hand is now.
  for (let i = 0; i < newPoints.length; i++) {
    smoothHand.keypoints[i].x = lerp(smoothHand.keypoints[i].x, newPoints[i].x, handSmoothing);
    smoothHand.keypoints[i].y = lerp(smoothHand.keypoints[i].y, newPoints[i].y, handSmoothing);
  }
}

//*change* a fresh, empty sign model. ml5 works out the inputs and outputs from the examples you give it.
function newSignModel() {
  signModel = ml5.neuralNetwork({ task: "classification" });
  sampleCounts = {};
  modelState = "collecting";
  prediction = null;
  recentGuesses = []; //*change*
  shownGuess = null; //*change*
  warning = ""; //*fix*
}

//*change* turns one hand into 42 numbers that describe its SHAPE, not where it is.
//each of the 21 points is measured from the wrist, then divided by the hand's size
//(wrist to middle knuckle), so moving your hand or holding it closer to the camera doesn't change the numbers.
function handToNumbers(hand) {
  let wrist = hand.keypoints[0];
  let middleKnuckle = hand.keypoints[9];
  let handSize = dist(wrist.x, wrist.y, middleKnuckle.x, middleKnuckle.y);
  let numbers = [];
  for (let point of hand.keypoints) {
    numbers.push((point.x - wrist.x) / handSize);
    numbers.push((point.y - wrist.y) / handSize);
  }
  return numbers;
}

//*change* while a letter key (or a compliment's number key 1 to 4) is held down and a hand is in view,
//save one example of it. uses the smoothed hand, so the examples are steadier.
function collectSample() {
  if (modelState !== "collecting" || !smoothHand || !keyIsPressed) {
    return;
  }

  let label;
  if (key.length === 1 && /[a-z]/i.test(key)) {
    label = key.toUpperCase(); //a letter, for fingerspelling.
  } else if (findCompliment(key)) {
    label = key; //*change* a number key 1 to 4, for a compliment gesture.
  } else {
    return; //any other key (Enter, arrows, 5 to 9...) is ignored here.
  }

  signModel.addData(handToNumbers(smoothHand), [label]);
  if (sampleCounts[label] === undefined) {
    sampleCounts[label] = 0;
  }
  sampleCounts[label] += 1;
}

//*change* the compliment that goes with this label ("1" to "4"), or undefined if it's a letter.
function findCompliment(label) {
  return compliments.find((compliment) => compliment.key === label);
}

//*change* the compliment it's showing right now, but only if it's sure enough. otherwise undefined.
function currentCompliment() {
  if (modelState !== "ready" || !shownGuess || shownGuess.confidence < complimentConfidence) {
    return undefined;
  }
  return findCompliment(shownGuess.label);
}

//*change* Enter: train on the examples. Backspace: start over.
function keyPressed() {
  if (key === "Enter") {
    trainSigns();
  }
  if (key === "Backspace") {
    newSignModel();
  }
}

//*change* trains the sign model on everything you've saved.
function trainSigns() {
  if (modelState !== "collecting") {
    return;
  }
  //it needs at least 2 different letters, or there's nothing to tell apart.
  //*fix* this used to fail silently, so it looked like Enter did nothing. now it says why.
  if (Object.keys(sampleCounts).length < 2) {
    warning = "can't train yet: teach at least 2 different signs first (e.g. hold 1, then hold 2)";
    return;
  }

  warning = ""; //*fix*
  modelState = "training";
  trainingRound = 0;
  signModel.normalizeData(); //puts all the numbers on the same scale, which helps it learn.
  signModel.train(
    { epochs: trainingRounds },
    (round) => {
      trainingRound = round + 1; //runs after every round, so the panel can count up.
    },
    () => {
      modelState = "ready"; //runs once when training is finished.
    },
  );
}

//*change* once trained, keeps guessing which letter the hand is making.
function guessSign() {
  if (modelState !== "ready") {
    return;
  }
  if (!smoothHand) {
    prediction = null; //no hand, no guess.
    recentGuesses = []; //*change*
    shownGuess = null; //*change*
    return;
  }
  if (classifying) {
    return; //still busy with the last guess.
  }

  classifying = true;
  //*fix* ml5 calls back with (results, error). on an error results is empty; classifying still resets so guessing never gets stuck.
  signModel.classify(handToNumbers(smoothHand), (results, error) => {
    classifying = false;
    if (error) {
      console.log("classify error:", error);
    }
    if (results) {
      prediction = results[0]; //results are sorted, so [0] is its best guess.
      steadyGuess(prediction); //*change*
    }
  });
}

//*change* steadier guess: remembers the last few guesses, and only changes what's on screen
//when more than half of them agree. one odd frame can't make the letter flicker.
function steadyGuess(guess) {
  recentGuesses.push(guess);
  if (recentGuesses.length > guessesToKeep) {
    recentGuesses.shift(); //forget the oldest one.
  }

  //count how many times each label shows up in the recent guesses.
  let counts = {};
  for (let g of recentGuesses) {
    counts[g.label] = (counts[g.label] || 0) + 1;
  }
  let best = Object.keys(counts).reduce((a, b) => (counts[a] >= counts[b] ? a : b));

  if (counts[best] > guessesToKeep / 2) {
    //how sure it is = the average confidence of the guesses that agree.
    let agreeing = recentGuesses.filter((g) => g.label === best);
    let confidence = agreeing.reduce((total, g) => total + g.confidence, 0) / agreeing.length;
    shownGuess = { label: best, confidence: confidence };
  }
}

//*change* draws the 21 hand points, lined up with the video using videoFit().
//*change* draws the smoothed points, so the dots don't jitter.
function drawHand() {
  if (!smoothHand || !video || video.width === 0) {
    return;
  }
  let fit = videoFit();
  push();
  noStroke();
  fill(0, 255, 140);
  for (let point of smoothHand.keypoints) {
    circle(
      point.x * fit.scale + fit.offsetX,
      point.y * fit.scale + fit.offsetY,
      10,
    );
  }
  pop();
}

//*change* the box in the top-left corner (under the Pause button): instructions and example counts.
//the guess is shown big in the top-right corner. both sit at the top so you can see them without scrolling.
function drawSignPanel() {
  let lines = [];
  if (!handPose) {
    lines.push("loading hand tracking...");
  } else if (modelState === "collecting") {
    lines.push(
      "SIGN PRACTICE: make a hand shape and HOLD its key (a letter, or 1-4 below)",
    );
    lines.push(
      "to save examples (50+ each, 2+ signs). then press Enter to train.",
    );
    //*change* compliments show their emoji instead of their number.
    let counts = Object.entries(sampleCounts).map((entry) => {
      let compliment = findCompliment(entry[0]);
      let name = compliment ? compliment.emoji : entry[0];
      return name + ": " + entry[1];
    });
    lines.push(counts.length > 0 ? counts.join("   ") : "no examples yet");
    lines.push(
      smoothHand
        ? "hand found"
        : "no hand found: hold your hand up to the camera",
    );
  } else if (modelState === "training") {
    lines.push("training... round " + trainingRound + " of " + trainingRounds);
  } else {
    lines.push("ready! make a hand shape. (Backspace = start over)");
    //*fix* always show what it's seeing right now, even when it's not sure enough to show a compliment,
    //so you can tell whether it's working but unsure, or not seeing your hand at all.
    if (!smoothHand) {
      lines.push("no hand found: hold your hand up to the camera");
    } else if (prediction) {
      let compliment = findCompliment(prediction.label);
      let name = compliment ? compliment.emoji + " " + compliment.name : prediction.label;
      lines.push("seeing: " + name + "  (" + round(prediction.confidence * 100) + "% sure)");
    }
  }
  if (warning) {
    lines.push(warning); //*fix*
  }

  let boxHeight = 20 + lines.length * 20; //*change* worked out first, so the compliment guide can go right under it.
  push();
  noStroke();
  fill(0, 180);
  rect(16, 52, 660, boxHeight, 8); //*change* was 560 wide, now fits the guide's longest line
  fill(255);
  textSize(14);
  textAlign(LEFT, TOP);
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], 28, 62 + i * 20);
  }

  //the guess, big in the top-right corner.
  //*change* uses the steadier guess. a compliment shows its emoji and full sentence; a letter shows the letter.
  let compliment = currentCompliment();
  //*change* a solid box behind the guess, so a new guess is never drawn on top of an old one
  //(with background(0) turned off, nothing else clears this corner between frames).
  if (compliment || (modelState === "ready" && shownGuess)) {
    let boxWidth = compliment ? 40 + max(80, compliment.sentence.length * 16) : 140;
    fill(0);
    rect(width - boxWidth - 8, 8, boxWidth, 168, 8);
    fill(255);
  }
  if (compliment) {
    textAlign(RIGHT, TOP);
    textSize(72);
    text(compliment.emoji, width - 24, 16);
    textSize(30);
    textStyle(BOLD);
    text(compliment.sentence, width - 24, 104);
    textStyle(NORMAL);
    textSize(16);
    text(round(shownGuess.confidence * 100) + "% sure", width - 24, 146);
  } else if (modelState === "ready" && shownGuess && !findCompliment(shownGuess.label)) {
    textAlign(RIGHT, TOP);
    textSize(96);
    text(shownGuess.label, width - 24, 16);
    textSize(18);
    text(round(shownGuess.confidence * 100) + "% sure", width - 24, 122);
  }
  pop();

  drawComplimentGuide(52 + boxHeight + 12); //*change*
}

//*change* the compliment guide: one row per gesture, with its emoji, key, how to make it, and its sentence.
//it sits under the instructions box. the row it's seeing right now lights up pink.
function drawComplimentGuide(top) {
  let rowHeight = 48;
  let boxWidth = 660;
  let boxHeight = 36 + compliments.length * rowHeight;
  let showing = currentCompliment();

  push();
  noStroke();
  fill(0, 180);
  rect(16, top, boxWidth, boxHeight, 8);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(14);
  textStyle(BOLD);
  text("COMPLIMENTS: make the gesture and hold its number key to teach it", 28, top + 10);
  textStyle(NORMAL);

  for (let i = 0; i < compliments.length; i++) {
    let compliment = compliments[i];
    let rowTop = top + 32 + i * rowHeight;

    if (showing === compliment) {
      fill(255, 120, 180, 120);
      rect(22, rowTop - 2, boxWidth - 12, rowHeight - 4, 6);
    }

    fill(255);
    textSize(28);
    text(compliment.emoji, 30, rowTop + 4);
    textSize(13);
    text("[" + compliment.key + "]  " + compliment.name + ": " + compliment.how, 74, rowTop + 2);
    textSize(14);
    textStyle(BOLD);
    text('"' + compliment.sentence + '"', 74, rowTop + 22);
    textStyle(NORMAL);
  }
  pop();
}

class Ball {
  constructor(x, y, r, c) {
    this.homeX = x; //its spot on the grid. it never drifts more than wander pixels from here.
    this.homeY = y;
    this.x = x;
    this.y = y;
    this.r = r; //its normal radius, before pulsing.
    this.originalColor = c; //its own blue / purple. kept safe, so dehighlight() can put it back.
    this.color = c; //the colour it's drawn with right now.
    this.highlightColor = color("red"); //the colour it shows when clicked or on the person.
    this.clicked = false; //mousePressed() flips this.
    this.onBody = false; //true while the ball is over the person. draw() sets it every frame.
    //*change* smoother body outline: goes up towards 1 while the ball is on the person, down towards 0 when not.
    //the ball only turns red once it's past halfway, so balls on the edge of your outline don't flicker.
    this.bodyAmount = 0;

    //the pulse: each ball gets its own speed and its own starting point, so they don't all pulse together.
    this.pulseSpeed = random(0.03, 0.1);
    this.pulseStart = random(TWO_PI);
  }

  //the radius right now. sin() goes smoothly from -1 to 1 and back,
  //so this goes from pulseAmount smaller to pulseAmount bigger and back.
  size() {
    return (
      this.r + sin(pulseTime * this.pulseSpeed + this.pulseStart) * pulseAmount
    );
  }

  //a tiny random step each frame, but never more than wander pixels from home.
  move() {
    this.x = constrain(
      this.x + random(-1, 1),
      this.homeX - wander,
      this.homeX + wander,
    );
    this.y = constrain(
      this.y + random(-1, 1),
      this.homeY - wander,
      this.homeY + wander,
    );
  }

  //is this ball sitting on the person? looks up the ball's spot in the segmentation mask.
  isOnBody(mask, scale, offsetX, offsetY) {
    //turn the canvas position into a position in the mask. the mask is the camera's size
    //(like 640 x 480), and the video is scaled up and centred in draw(), so this undoes that.
    let maskX = floor((this.x - offsetX) / scale);
    let maskY = floor((this.y - offsetY) / scale);

    //outside the mask (can happen right at the edges): not on the body.
    if (maskX < 0 || maskX >= mask.width || maskY < 0 || maskY >= mask.height) {
      return false;
    }

    //each pixel takes 4 spots in mask.pixels: red, green, blue, alpha. so pixel number n starts at n * 4.
    let index = (maskY * mask.width + maskX) * 4;
    let alpha = mask.pixels[index + 3];

    //with maskType "person", the person is see-through (alpha 0) and the room is solid (alpha 255),
    //so a low alpha means the ball is on the body.
    return alpha < 128;
  }

  //is this point (like the mouse) inside the ball right now?
  contains(externalX, externalY) {
    let distance = dist(this.x, this.y, externalX, externalY);
    return distance <= this.size(); //closer than the radius = inside.
  }

  //runs every frame: red if it's been clicked OR the person is over it, its own colour if not.
  update() {
    this.bodyAmount = lerp(this.bodyAmount, this.onBody ? 1 : 0, 0.3); //*change*
    if (this.clicked || this.bodyAmount > 0.5) {
      this.highlight();
    } else {
      this.dehighlight();
    }
  }

  highlight() {
    this.color = this.highlightColor;
  }

  dehighlight() {
    this.color = this.originalColor;
  }

  show() {
    fill(this.color);
    noStroke();
    circle(this.x, this.y, this.size() * 2);
  }
}
