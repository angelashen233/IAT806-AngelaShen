// lab 06: a full screen of pulsing balls that react to your body and your hands.
// - each ball sits in its own spot on a grid, wobbles around it a little, and pulses 5 pixels bigger and smaller.
// - the webcam finds your body, and the balls on top of you turn red. click a ball to turn it red too.
// - *change* hand gesture recognition: teach it letters from the ASL alphabet (fingerspelling),
//   then it shows which letter your hand is making.
// - *change* compliments: an on-screen guide shows 4 hand gestures. teach them with the number keys 1 to 4,
//   and when it sees one, it shows that gesture's compliment sentence.
// - *change* smaller balls, and steadier tracking (smoothed hand points, a steadier guess, a smoother body outline).
// - *game* game mode: press the "Game mode" button to practise basic sentences (Hi, How are you?, ...)
//   against a timer. finishing a sentence in time gives points, plus bonus points for the seconds left.
// - *game* even smaller balls, in pastel light blue and light purple.
// - *levels* the game has 3 levels: 1 single signs, 2 short sentences, 3 longer sentences from memory.
// - *api* in levels 1 and 2, a box shows the real ASL sign as a moving stick figure. it comes from sign.mt's free API.
// - *eat* in game mode, each sign you finish eats some of the balls on your body (splice), from your hand outwards.
//   they come back (push) for the next sentence.
// - *smile* face-api.js watches your face. when you smile, every ball blooms into a little flower, brighter and more
//   colourful the bigger the smile. stop smiling and they close back into balls.
// - *sound* sound effects: a whoosh when a hand shows up, a chime for each correct sign, and a level up sound when you pass a level.
// - *flower* when you pass a level, a flower opens behind you and the balls turn off until the next level.
//
// REFERENCES
// body segmentation: ml5.js example "bodySegmentation-mask-person", https://editor.p5js.org/ml5/sketches/h6TN8umP5
// *change* hand tracking and the sign classifier: ml5.js handPose and neuralNetwork, https://ml5js.org/
// ml5.js license and Code of Conduct: https://github.com/ml5js/ml5-next-gen/blob/main/LICENSE.md
// *api* the real-sign animations: sign.mt, an open-source sign language translator, https://sign.mt/
// and its pose-viewer component (loaded in index.html), https://www.npmjs.com/package/pose-viewer
// *smile* face detection and smile (expression) tracking: face-api.js by Vincent Mühler (justadudewhohacks),
// its tiny face detector and face expression models, https://justadudewhohacks.github.io/face-api.js/docs/index.html
// (code: https://github.com/justadudewhohacks/face-api.js). loaded through @vladmandic/face-api 1.7.15 by Vladimir Mandic,
// an updated version of face-api.js that works alongside ml5, https://github.com/vladmandic/face-api

//settings: change these to see what happens.
let spacing = 20; //how many pixels apart the balls' spots are. smaller = more balls (but slower: 16 dropped to ~10 fps).
//*change* smaller balls: pulse and wander were 5 and 4, with a radius of 8 to 14 (see makeBalls()).
//*game* smaller again: pulse and wander were 2 and 2, with a radius of 3 to 6.
let pulseAmount = 1; //how many pixels bigger and smaller each ball gets as it pulses.
let wander = 1.5; //how many pixels a ball can drift away from its spot.
let minRadius = 1.5; //*change* the smallest and biggest a ball can be (its radius, before pulsing).
let maxRadius = 3.5;

//*smile* smile tracking with face-api.js.
let faceModels = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model"; //where its trained models are downloaded from.
let smileTarget = 0; //how much you're smiling in the latest check, 0 to 1 (face-api's "happy" score).
let smile = 0; //the same, but eased towards smileTarget every frame, so the balls brighten smoothly instead of flickering.
let smileChecksPerSecond = 10; //how often it looks for your smile. a smile doesn't need more, and it leaves the computer free for hand tracking.
let flowerPetals = 5; //how many petals each little ball-flower has when it blooms.

let myBalls = [];
let eatenSpots = []; //*eat* the grid spots of the balls that got eaten, so new balls can come back to the same places.

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

// ---------------------------------------------------------------------------
// *game* GAME MODE settings and sentences
// ---------------------------------------------------------------------------
let gameOn = false; //the "Game mode" button flips this.
let gameButton;
let bonusPerSecond = 10; //bonus points for every second still left on the timer.
let holdSeconds = 0.8; //how long you have to hold a hand shape before it counts.
let readySeconds = 3; //time to read the sentence before the timer starts.
let messageSeconds = 2.5; //how long the "yes!" or "time's up" message stays before the next sentence.

//*sound* the sound effects. they load in setup(), and stay undefined until they've finished loading.
let levelUpSound; //you passed a level.
let handSound; //a hand showed up in front of the camera.
let correctSound; //you held a sign's hand shape long enough: that sign is done.
let handSoundGap = 1; //how many seconds the hand has to be gone before it plays handSound again, so a flicker doesn't replay it.
let handLostTime = -10000; //when the hand was last lost (in millis). starts long ago, so the first hand plays the sound.

//*flower* the flower that opens behind you when you pass a level.
let bloomSeconds = 2.5; //how long it takes to open all the way.
let petalCount = 10; //how many petals in each ring.
let bloom = 0; //0 = a closed bud, 1 = wide open.
let flowerLayer; //a separate drawing the size of the camera, so the person can be cut out of it with the mask.

//the hand shapes the game can check. each one says which fingers should be up, in the order
//thumb, index, middle, ring, pinky. true = up, false = folded, null = doesn't matter.
let handShapes = {
  flat: [null, true, true, true, true],
  point: [null, true, false, false, false],
  thumbUp: [true, false, false, false, false],
  fist: [false, false, false, false, false],
  loveYou: [true, true, false, false, true],
};

//*levels* the signs, written once, so the levels can reuse them.
//these are SIMPLIFIED for one hand and a webcam: the game only checks the hand shape.
//real ASL signs also use movement, where the hand is, both hands, and your face
//(the "how" text says what the real sign does, and the demo box shows it).
let signs = {
  hello: { sign: "HELLO", shape: "flat", emoji: "\u{270B}", how: "flat hand, fingers up, by your forehead (it moves out like a salute)" },
  thankYou: { sign: "THANK YOU", shape: "flat", emoji: "\u{270B}", how: "flat hand, fingertips at your chin (it moves forward, away from you)" },
  you: { sign: "YOU", shape: "point", emoji: "\u{261D}\u{FE0F}", how: "point your index finger (at the person you're talking to)" },
  there: { sign: "THERE", shape: "point", emoji: "\u{261D}\u{FE0F}", how: "point your index finger (towards where it is)" },
  how: { sign: "HOW", shape: "thumbUp", emoji: "\u{1F44D}", how: "curled fingers with your thumb up (two hands roll forward, knuckles together)" },
  help: { sign: "HELP", shape: "thumbUp", emoji: "\u{1F44D}", how: "fist with your thumb up (it sits on your other palm and lifts up)" },
  washroom: { sign: "WASHROOM", shape: "fist", emoji: "\u{270A}", how: "fist with your thumb tucked under your index finger, the letter T (it shakes)" },
  yes: { sign: "YES", shape: "fist", emoji: "\u{270A}", how: "a fist (it nods up and down, like a head nodding)" },
  loveYou: { sign: "I LOVE YOU", shape: "loveYou", emoji: "\u{1F91F}", how: "thumb, index finger and pinky up; middle and ring fingers folded" },
};

//*levels* the 3 levels. each level has its own time limit and points, and gets harder:
//level 1 is one sign at a time, level 2 is two signs, level 3 is three signs with the hints hidden.
//"demo" is the text sent to the sign API when it's different from the sentence
//(the API knows the American word "bathroom" better than "washroom").
let levels = [
  {
    name: "Single signs",
    seconds: 20, //the time limit for each sentence.
    points: 100, //points for finishing a sentence in time.
    showHow: true, //show how to make each sign?
    showDemo: true, //show the real sign in the demo box?
    sentences: [
      { sentence: "Hi!", demo: "hello", steps: [signs.hello] },
      { sentence: "You", steps: [signs.you] },
      { sentence: "Help", steps: [signs.help] },
      { sentence: "Washroom", demo: "bathroom", steps: [signs.washroom] },
      { sentence: "Thank you.", steps: [signs.thankYou] },
      { sentence: "I love you.", steps: [signs.loveYou] },
    ],
  },
  {
    name: "Short sentences",
    seconds: 20,
    points: 150,
    showHow: true,
    showDemo: true,
    sentences: [
      { sentence: "How are you?", steps: [signs.how, signs.you] },
      { sentence: "Do you need help?", steps: [signs.you, signs.help] },
      { sentence: "The washroom is there.", demo: "the bathroom is there", steps: [signs.washroom, signs.there] },
      { sentence: "Yes, thank you.", steps: [signs.yes, signs.thankYou] },
    ],
  },
  {
    name: "Longer sentences, from memory",
    seconds: 15,
    points: 200,
    showHow: false, //no hints: you have to remember the shapes. (they come back if you run out of time.)
    showDemo: false,
    sentences: [
      { sentence: "Hi, how are you?", steps: [signs.hello, signs.how, signs.you] },
      { sentence: "Hi, do you need help?", steps: [signs.hello, signs.you, signs.help] },
      { sentence: "The washroom is there, thank you.", steps: [signs.washroom, signs.there, signs.thankYou] },
      { sentence: "Thank you, I love you.", steps: [signs.thankYou, signs.loveYou] },
    ],
  },
];

//where the game is right now.
let gameState = "ready"; //"ready" (reading time), "playing", "success", "timeup", or "levelDone".
let levelIndex = 0; //*levels* which level you're on.
let sentenceIndex = 0; //which sentence of that level you're on.
let stepIndex = 0; //which sign of that sentence you're on.
let timeLeft = 0; //seconds left on the timer.
let holdTime = 0; //how long you've held the right shape so far.
let waitLeft = 0; //seconds left of reading time, or of the message between sentences.
let score = 0;
let levelScore = 0; //*levels* the points from this level only, so trying a level again can take them back off.
let lastBonus = 0; //the time bonus from the sentence you just finished.
let sentenceResults = []; //true or false for each sentence played in this level: did you finish it in time?

//*api* the real-sign demo box. it asks sign.mt's free API (no key or account needed) to translate
//the sentence into ASL, and plays the answer as a moving stick figure.
//only the sentence text is sent. it's a machine translation, so treat it as a guide, not a teacher.
let signApi = "https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose";
let demoBox; //the box on the page that holds the stick figure and its caption.
let demoViewer; //the <pose-viewer> element that plays the animation.
let demoCaption;
let demoFiles = {}; //the API addresses that have already worked, so each sentence is only checked once.

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

  //*game* the game mode button, next to the pause button.
  gameButton = createButton("Game mode: off");
  gameButton.parent("sketch-holder");
  gameButton.position(100, 16);
  gameButton.mousePressed(toggleGame);
  makeDemoBox(); //*api*

  makeBalls();
  newSignModel(); //*change*

  //*sound* no await, so the balls show up right away and the sounds are ready a little later (like lab-05's explosion).
  loadSound("universfield-level-up-06-370051.mp3").then((s) => {
    levelUpSound = s;
  });
  loadSound("djartmusic-magical-sparkle-whoosh-298750.mp3").then((s) => {
    handSound = s;
  });
  loadSound("emand_edroff-fairy-dust-magical-chime-576279.mp3").then((s) => {
    correctSound = s;
  });

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

  //*smile* face-api.js needs two models: one to find your face, and one to read its expression.
  await faceapi.nets.tinyFaceDetector.loadFromUri(faceModels);
  await faceapi.nets.faceExpressionNet.loadFromUri(faceModels);
  checkSmile();
}

//*smile* looks for your face and reads how much you're smiling, then does it again a moment later.
//face-api doesn't have a detectStart() like ml5, so this keeps calling itself instead.
async function checkSmile() {
  //readyState 2 or more means the camera has a picture to look at.
  if (video.elt.readyState >= 2) {
    try {
      let face = await faceapi
        .detectSingleFace(video.elt, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();
      //no face found: no smile.
      smileTarget = face ? face.expressions.happy : 0;
    } catch (error) {
      console.warn("smile check didn't work this time:", error);
    }
  }
  setTimeout(checkSmile, 1000 / smileChecksPerSecond);
}

// how wide the sketch-holder div is, in pixels
function sketch_holder_width() {
  return document.getElementById("sketch-holder").clientWidth;
}

// keeps the canvas full size when the window changes size, and fills the new space with balls.
function windowResized() {
  resizeCanvas(sketch_holder_width(), windowHeight);
  makeBalls();
  placeDemoBox(); //*api*
}

//a random colour somewhere between pastel light blue and pastel light purple.
//*game* was a strong blue (40, 90, 230) and a strong purple (150, 60, 220).
function bluePurple() {
  let blue = color(170, 215, 255);
  let purple = color(210, 185, 255);
  return lerpColor(blue, purple, random(1)); //random(1) = how far along from blue to purple, 0 to 1.
}

//*smile* a brighter, more colourful version of a colour. it pushes red, green and blue further apart
//(more colourful), then lifts them all so the strongest one is 255 (brighter).
function brighter(c) {
  let r = red(c);
  let g = green(c);
  let b = blue(c);
  let average = (r + g + b) / 3;
  r = constrain(average + (r - average) * 2.5, 0, 255);
  g = constrain(average + (g - average) * 2.5, 0, 255);
  b = constrain(average + (b - average) * 2.5, 0, 255);
  let lift = 255 / max(r, g, b, 1);
  return color(r * lift, g * lift, b * lift);
}

//fills the whole canvas with balls, one every spacing pixels across and down.
function makeBalls() {
  myBalls = [];
  eatenSpots = []; //*eat* a whole new grid, so there's nothing left to bring back.
  for (let x = spacing / 2; x < width; x += spacing) {
    for (let y = spacing / 2; y < height; y += spacing) {
      myBalls.push(new Ball(x, y, random(minRadius, maxRadius), bluePurple())); //put smth inside of the array
    }
  }
}

//*eat* the middle of your hand, in canvas pixels, so eatBalls() can start from there. null when there's no hand.
function handMiddle() {
  if (!smoothHand || !video || video.width === 0) {
    return null;
  }
  let fit = videoFit();
  let points = smoothHand.keypoints;

  //the middle of the hand is the average of its 21 points.
  let middleX = 0;
  let middleY = 0;
  for (let point of points) {
    middleX += point.x;
    middleY += point.y;
  }
  middleX /= points.length;
  middleY /= points.length;

  return {
    x: middleX * fit.scale + fit.offsetX,
    y: middleY * fit.scale + fit.offsetY,
  };
}

//*eat* the balls sitting on your body that haven't been eaten yet.
function bodyBalls() {
  return myBalls.filter((ball) => ball.bodyAmount > 0.5 && !ball.eaten);
}

//*eat* marks some of the balls on your body as eaten. they shrink away, then removeEatenBalls() takes them out.
//the ones closest to your hand go first, so they disappear from your hand outwards.
function eatBalls(howMany) {
  let onBody = bodyBalls();
  let hand = handMiddle();
  if (hand) {
    onBody.sort((a, b) => dist(a.x, a.y, hand.x, hand.y) - dist(b.x, b.y, hand.x, hand.y));
  } else {
    shuffle(onBody, true); //no hand: eat them in a random order.
  }
  for (let i = 0; i < howMany && i < onBody.length; i++) {
    onBody[i].eaten = true;
  }
}

//*eat* takes the balls that have finished shrinking out of the array, and remembers their spots.
function removeEatenBalls() {
  //going backwards, so removing a ball doesn't skip the next one.
  for (let i = myBalls.length - 1; i >= 0; i--) {
    let ball = myBalls[i];
    if (ball.gone()) {
      eatenSpots.push({ x: ball.homeX, y: ball.homeY });
      myBalls.splice(i, 1);
    }
  }
}

//*eat* brings the eaten balls back: a new ball grows in at each spot that was eaten.
function restoreBalls() {
  for (let ball of myBalls) {
    ball.eaten = false; //any ball still shrinking grows back instead.
  }
  for (let spot of eatenSpots) {
    let ball = new Ball(spot.x, spot.y, random(minRadius, maxRadius), bluePurple());
    ball.grow = 0; //starts at nothing and grows in.
    myBalls.push(ball);
  }
  eatenSpots = [];
}

//*flower* is the flower open right now? only on the "level done" screen, and only when you passed.
function flowerShowing() {
  return gameOn && gameState === "levelDone" && levelPassed();
}

//*flower* draws the flower into flowerLayer, cuts the person out of it with the body mask,
//then puts it on the canvas lined up with the video. so it looks like it's behind you.
function drawFlower(fit) {
  //the layer is the camera's size, the same as the mask, so they line up exactly.
  if (!flowerLayer || flowerLayer.width !== video.width || flowerLayer.height !== video.height) {
    flowerLayer = createGraphics(video.width, video.height);
    flowerLayer.pixelDensity(1);
  }

  if (!paused) {
    bloom = min(1, bloom + deltaTime / 1000 / bloomSeconds);
  }
  let open = 1 - pow(1 - bloom, 3); //fast at first, then slows down as it finishes opening.

  let g = flowerLayer;
  g.clear();
  g.push();
  g.translate(g.width / 2, g.height / 2);
  g.rotate(frameCount * 0.003); //a slow turn, so it feels alive.
  g.noStroke();
  let size = min(g.width, g.height) * 0.5 * (0.3 + 0.7 * open); //starts small and grows as it opens.

  //each petal's angle is spread out by open: at 0 they all point up (a bud), at 1 they go all the way round.
  //outer ring: big pastel purple petals.
  g.fill(gamePurple[0], gamePurple[1], gamePurple[2]);
  for (let i = 0; i < petalCount; i++) {
    g.push();
    g.rotate(((i - (petalCount - 1) / 2) / petalCount) * TWO_PI * open);
    g.ellipse(0, -size * 0.55, size * 0.42, size * 1.1);
    g.pop();
  }
  //inner ring: smaller pink petals, sitting between the outer ones.
  g.fill(255, 170, 205);
  for (let i = 0; i < petalCount; i++) {
    g.push();
    g.rotate(((i + 0.5 - (petalCount - 1) / 2) / petalCount) * TWO_PI * open);
    g.ellipse(0, -size * 0.35, size * 0.3, size * 0.7);
    g.pop();
  }
  //the middle.
  g.fill(255, 220, 120);
  g.circle(0, 0, size * 0.35);
  g.pop();

  //the mask is solid on the room and see-through on the person (see isOnBody), so masking keeps the flower
  //only on the room. the person, drawn underneath in the video, shows through in front of it.
  let flower = g.get();
  flower.mask(segmentation.mask);
  image(flower, fit.offsetX, fit.offsetY, video.width * fit.scale, video.height * fit.scale);
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
    //*eat* game mode shows the whole camera, so you can see yourself (and the flower can open behind you).
    //it also paints over the whole canvas every frame, so eaten balls don't leave marks behind.
    if (!gameOn) {
      video.mask(segmentation.mask);
    }
    image(
      video,
      fit.offsetX,
      fit.offsetY,
      video.width * fit.scale,
      video.height * fit.scale,
    );

    //*flower* passed a level: a flower opens behind you, drawn over the room but not over you.
    if (flowerShowing()) {
      drawFlower(fit);
    }
  }

  smile = lerp(smile, smileTarget, 0.1); //*smile*

  for (let ball of myBalls) {
    //*flower* the balls are turned off while the flower is open. they come back with the next level.
    if (flowerShowing()) {
      break;
    }
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
  removeEatenBalls(); //*eat*

  //*game* game mode swaps the practice panels for the game. the teaching keys are off while it's on.
  if (gameOn) {
    updateGame();
    drawHand();
    drawGamePanel();
    return;
  }

  //*change* hand gesture recognition
  collectSample();
  guessSign();
  drawHand();
  drawSignPanel();
}

//*sound* plays a sound, but only once it has loaded (before that, the variable is still undefined).
function playSound(sound) {
  if (sound) {
    sound.play();
  }
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
  userStartAudio(); //*sound* browsers block sound until the user clicks; this switches it on.

  //clicks on the pause button come here too. this skips them, so the ball under the button doesn't turn red.
  if (event && (event.target === pauseButton.elt || event.target === gameButton.elt)) {
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
    if (smoothHand !== null) {
      handLostTime = millis(); //*sound* the hand was here last frame, so it was lost just now.
    }
    smoothHand = null;
    return;
  }

  let newPoints = hands[0].keypoints;
  if (smoothHand === null) {
    //*sound* a hand just showed up. only plays if it was gone for a while, not for a one-frame flicker.
    if (millis() - handLostTime > handSoundGap * 1000) {
      playSound(handSound);
    }
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
  //*game* in game mode the teaching keys do nothing.
  //*levels* Enter moves on when a level is done, and 1, 2, 3 jump straight to a level.
  if (gameOn) {
    if (key === "Enter" && gameState === "levelDone") {
      nextLevel();
    }
    if (key >= "1" && key <= String(levels.length)) {
      score = 0;
      startLevel(Number(key) - 1);
    }
    return;
  }
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

// ---------------------------------------------------------------------------
// *game* GAME MODE
// how to play:
// 1. press the "Game mode" button. a sentence appears, with the sign(s) that make it.
// 2. after a short "get ready", the timer starts. make each hand shape and hold it until its bar fills.
// 3. finish the sentence before the timer runs out: points, plus 10 bonus points for every second left.
// 4. *levels* sign at least half of a level's sentences in time to move up to the next level.
//    Enter moves on when a level is done. the keys 1, 2 and 3 jump straight to a level.
// no teaching needed: the game checks which fingers are up, straight from the hand points.
// ---------------------------------------------------------------------------

//turns game mode on and off. turning it on always starts a new game.
function toggleGame() {
  userStartAudio(); //*sound* browsers block sound until the user clicks; this switches it on.
  gameOn = !gameOn;
  gameButton.html(gameOn ? "Game mode: on" : "Game mode: off");
  clear(); //wipes the old panels off the canvas, since nothing else clears it.
  if (gameOn) {
    startGame();
  } else {
    demoBox.hide(); //*api*
    restoreBalls(); //*eat*
  }
}

function startGame() {
  score = 0;
  startLevel(0);
}

//*levels* starts a level from its first sentence.
function startLevel(index) {
  levelIndex = index;
  levelScore = 0;
  sentenceResults = [];
  startSentence(0);
}

function startSentence(index) {
  sentenceIndex = index;
  stepIndex = 0;
  timeLeft = levels[levelIndex].seconds;
  holdTime = 0;
  waitLeft = readySeconds;
  gameState = "ready";
  loadDemo(); //*api*
  restoreBalls(); //*eat* a new sentence: the eaten balls come back.
}

//*levels* did you sign at least half of this level's sentences in time?
function levelPassed() {
  let learned = sentenceResults.filter((result) => result).length;
  return learned * 2 >= levels[levelIndex].sentences.length;
}

//*levels* Enter on the "level done" screen: up a level if you passed, the same level again if not.
//after the last level, it starts again from level 1.
function nextLevel() {
  if (!levelPassed()) {
    score -= levelScore; //trying again, so this level's points come back off.
    startLevel(levelIndex);
  } else if (levelIndex + 1 < levels.length) {
    startLevel(levelIndex + 1);
  } else {
    startGame();
  }
}

// ---------------------------------------------------------------------------
// *api* THE REAL-SIGN DEMO BOX (sign.mt)
// ---------------------------------------------------------------------------

//makes the box once, in setup(). it's a normal page element sitting on top of the canvas, like the buttons.
function makeDemoBox() {
  demoBox = createDiv("");
  demoBox.parent("sketch-holder");
  demoBox.style("position", "absolute");
  demoBox.style("width", "240px");
  demoBox.style("padding", "10px");
  demoBox.style("border-radius", "12px");
  demoBox.style("background", "rgb(240, 235, 255)");
  demoBox.style("color", "rgb(70, 55, 120)");
  demoBox.style("font-size", "12px");

  //<pose-viewer> comes from the pose-viewer script in index.html. it plays a .pose file as a stick figure.
  demoViewer = document.createElement("pose-viewer");
  demoViewer.setAttribute("loop", "true");
  demoViewer.setAttribute("width", "240px");
  demoViewer.setAttribute("aspect-ratio", "1");
  demoBox.elt.appendChild(demoViewer);

  demoCaption = createDiv("");
  demoCaption.parent(demoBox);

  demoBox.hide();
  placeDemoBox();
}

//top-right corner if the window is wide enough, otherwise under the game panel.
function placeDemoBox() {
  if (width >= 960) {
    demoBox.position(width - 276, 16);
  } else {
    demoBox.position(16, 52 + gamePanelHeight() + 12);
  }
}

//asks the API for the current sentence's sign and plays it. called at the start of every sentence.
async function loadDemo() {
  let level = levels[levelIndex];
  if (!level.showDemo) {
    demoBox.hide(); //level 3 is from memory, so no demo.
    return;
  }
  demoBox.show();

  let current = level.sentences[sentenceIndex];
  let words = current.demo || current.sentence; //what to ask the API for.
  demoCaption.html("loading the real sign...");

  try {
    if (!demoFiles[words]) {
      //spoken=en means the text is English, signed=ase means American Sign Language.
      let address = signApi + "?text=" + encodeURIComponent(words) + "&spoken=en&signed=ase";
      //ask once first, to find out if the API is reachable. if it isn't, this jumps to the catch below.
      let response = await fetch(address);
      if (!response.ok) {
        throw new Error("sign API answered " + response.status);
      }
      demoFiles[words] = address; //remember that this one works, so it's only checked once.
    }
    //if the game has moved on to another sentence while this was downloading, don't show the old one.
    if (current !== levels[levelIndex].sentences[sentenceIndex]) {
      return;
    }
    demoViewer.setAttribute("src", demoFiles[words]);
    demoCaption.html('The real ASL sign for "' + words + '", machine-translated by sign.mt. Watch how it moves, then copy the hand shape.');
  } catch (error) {
    console.log("sign demo error:", error);
    demoCaption.html("Couldn't load the real sign (is the internet on?). The game still works without it.");
  }
}

//which fingers are up? gives 5 true / false values: thumb, index, middle, ring, pinky.
//a finger is up when its tip is clearly further from the wrist than its middle joint.
//(a folded finger's tip curls back towards the wrist.)
function fingersUp(hand) {
  let points = hand.keypoints;
  let wrist = points[0];
  let handSize = dist(wrist.x, wrist.y, points[9].x, points[9].y); //wrist to middle knuckle.

  //the thumb folds sideways, not towards the wrist, so it's checked differently:
  //it's up when its tip is far from the index finger's knuckle.
  let thumb = dist(points[4].x, points[4].y, points[5].x, points[5].y) > handSize * 0.5;

  let up = [thumb];
  let tips = [8, 12, 16, 20]; //the hand points at the tips of the index, middle, ring and pinky fingers.
  for (let tip of tips) {
    let joint = points[tip - 2]; //the finger's middle joint is 2 points before its tip.
    let tipDistance = dist(points[tip].x, points[tip].y, wrist.x, wrist.y);
    let jointDistance = dist(joint.x, joint.y, wrist.x, wrist.y);
    up.push(tipDistance > jointDistance * 1.1);
  }
  return up;
}

//is the hand making this shape? every finger the shape cares about has to match.
function matchesShape(hand, shapeName) {
  let wanted = handShapes[shapeName];
  let up = fingersUp(hand);
  for (let i = 0; i < wanted.length; i++) {
    if (wanted[i] !== null && wanted[i] !== up[i]) {
      return false;
    }
  }
  return true;
}

//words for what the camera sees, like "thumb + index up", so you can tell why a shape isn't counting.
function describeHand(hand) {
  let names = ["thumb", "index", "middle", "ring", "pinky"];
  let up = fingersUp(hand);
  let upNames = names.filter((name, i) => up[i]);
  if (upNames.length === 0) {
    return "a fist (no fingers up)";
  }
  return upNames.join(" + ") + " up";
}

//runs every frame in game mode: counts down the timer and checks the hand shape.
function updateGame() {
  //the clocks wait while paused, when the level is over, and until hand tracking has loaded.
  if (!handPose || paused || gameState === "levelDone") {
    return;
  }
  let level = levels[levelIndex];
  let seconds = min(deltaTime / 1000, 0.1); //how long the last frame took. capped, so a frozen tab can't eat the timer.

  if (gameState === "ready") {
    waitLeft -= seconds;
    if (waitLeft <= 0) {
      gameState = "playing";
    }
    return;
  }

  if (gameState === "success" || gameState === "timeup") {
    waitLeft -= seconds;
    if (waitLeft <= 0) {
      if (sentenceIndex + 1 < level.sentences.length) {
        startSentence(sentenceIndex + 1);
      } else {
        gameState = "levelDone"; //*levels*
        demoBox.hide(); //*api*
        if (levelPassed()) {
          playSound(levelUpSound); //*sound* only when you passed, not when you have to try the level again.
          bloom = 0; //*flower* starts closed, then opens.
        }
      }
    }
    return;
  }

  //playing: the timer runs down.
  timeLeft -= seconds;
  if (timeLeft <= 0) {
    timeLeft = 0;
    sentenceResults.push(false);
    waitLeft = messageSeconds;
    gameState = "timeup";
    return;
  }

  //holding the right shape fills the hold bar. letting go drains it (quickly, but not all at once,
  //so one shaky frame doesn't throw away your hold).
  let steps = level.sentences[sentenceIndex].steps;
  if (smoothHand && matchesShape(smoothHand, steps[stepIndex].shape)) {
    holdTime += seconds;
  } else {
    holdTime = max(0, holdTime - seconds * 2);
  }

  if (holdTime >= holdSeconds) {
    //*eat* that sign is done: eat an equal share of the balls on your body for each sign left,
    //so the last sign of the sentence eats all the ones that are left.
    let signsLeft = steps.length - stepIndex;
    eatBalls(ceil(bodyBalls().length / signsLeft));
    playSound(correctSound); //*sound*

    stepIndex += 1; //that sign is done, on to the next one.
    holdTime = 0;
    if (stepIndex >= steps.length) {
      //the whole sentence, in time: points, plus the bonus for the seconds left.
      lastBonus = ceil(timeLeft) * bonusPerSecond;
      score += level.points + lastBonus;
      levelScore += level.points + lastBonus;
      sentenceResults.push(true);
      waitLeft = messageSeconds;
      gameState = "success";
    }
  }
}

//the game's colours: pastel light purple and light blue, with dark purple writing.
let gameInk = [70, 55, 120];
let gamePaper = [240, 235, 255];
let gameBlue = [150, 205, 250];
let gamePurple = [190, 160, 245];

//the panel is always the same height (tall enough for the longest sentence and for the longest end screen
//in any level), so a shorter panel never leaves bits of a taller one behind on the canvas.
function gamePanelHeight() {
  let mostSteps = 0;
  let mostSentences = 0;
  for (let level of levels) {
    mostSentences = max(mostSentences, level.sentences.length);
    for (let sentence of level.sentences) {
      mostSteps = max(mostSteps, sentence.steps.length);
    }
  }
  return max(160 + mostSteps * 48, 170 + mostSentences * 20);
}

//the game panel, in the top-left corner under the buttons.
function drawGamePanel() {
  let left = 16;
  let top = 52;
  let panelWidth = min(660, width - 32);
  let panelHeight = gamePanelHeight();
  let level = levels[levelIndex];

  push();
  noStroke();
  textAlign(LEFT, TOP);
  fill(...gamePaper);
  rect(left, top, panelWidth, panelHeight, 12);

  if (gameState === "levelDone") {
    drawLevelDone(left, top, panelWidth, panelHeight);
    pop();
    return;
  }

  let current = level.sentences[sentenceIndex];

  //top row: which level and sentence, and the score.
  fill(...gameInk);
  textSize(14);
  textStyle(BOLD);
  text(
    "LEVEL " + (levelIndex + 1) + " of " + levels.length + "  ·  " + level.name +
      "  ·  " + (sentenceIndex + 1) + " of " + level.sentences.length,
    left + 14,
    top + 12,
  );
  textAlign(RIGHT, TOP);
  text("score: " + score, left + panelWidth - 14, top + 12);

  //the sentence, big, with the seconds left beside it.
  textSize(22);
  text(ceil(timeLeft) + " s", left + panelWidth - 14, top + 42);
  textAlign(LEFT, TOP);
  textSize(current.sentence.length > 28 ? 24 : 30); //long sentences get smaller writing, so they fit.
  text(current.sentence, left + 14, top + 36);
  textStyle(NORMAL);

  //the timer bar: shrinks as time runs out, and goes from blue to purple.
  let barWidth = panelWidth - 28;
  let fraction = timeLeft / level.seconds; //1 = all the time left, 0 = none.
  fill(222, 214, 246);
  rect(left + 14, top + 80, barWidth, 10, 5);
  fill(lerpColor(color(...gamePurple), color(...gameBlue), fraction));
  rect(left + 14, top + 80, barWidth * fraction, 10, 5);

  //one row for each sign in the sentence.
  //*levels* level 3 hides how to make each sign. the hints come back when time runs out, so you can learn them.
  let showHow = level.showHow || gameState === "timeup";
  let rowHeight = 48;
  for (let i = 0; i < current.steps.length; i++) {
    let step = current.steps[i];
    let rowTop = top + 102 + i * rowHeight;
    let done = i < stepIndex;
    let isCurrent = i === stepIndex && gameState === "playing";

    if (isCurrent) {
      fill(214, 232, 255); //the sign you're on lights up light blue.
      rect(left + 8, rowTop - 4, panelWidth - 16, rowHeight - 4, 8);
      //the hold bar, along the bottom of the row.
      fill(...gamePurple);
      rect(left + 8, rowTop + rowHeight - 14, (panelWidth - 16) * min(holdTime / holdSeconds, 1), 6, 3);
    }

    fill(...gameInk);
    textSize(26);
    if (done) {
      text("✓", left + 16, rowTop + 2);
    } else if (showHow) {
      text(step.emoji, left + 16, rowTop + 2);
    } else {
      text("?", left + 20, rowTop + 2); //from memory: the emoji would give the shape away.
    }
    textSize(14);
    textStyle(BOLD);
    text(step.sign, left + 60, rowTop);
    textStyle(NORMAL);
    textSize(13);
    text(showHow ? step.how : "from memory: which hand shape was it?", left + 60, rowTop + 18);
  }

  //the message line: what's happening right now.
  let message;
  if (!handPose) {
    message = "loading hand tracking...";
  } else if (paused) {
    message = "paused";
  } else if (gameState === "ready") {
    message = "get ready... the timer starts in " + ceil(waitLeft);
  } else if (gameState === "success") {
    message = "Yes! +" + level.points + " points, +" + lastBonus + " time bonus";
  } else if (gameState === "timeup") {
    message = "Time's up! Have another look at the shapes above.";
  } else if (smoothHand) {
    message = "hold the shape until the bar fills. camera sees: " + describeHand(smoothHand);
  } else {
    message = "no hand found: hold your hand up to the camera";
  }
  let messageTop = top + panelHeight - 50;
  fill(...gameInk);
  textSize(14);
  textStyle(BOLD);
  text(message, left + 14, messageTop);
  textStyle(NORMAL);
  textSize(12);
  text(
    "Simplified one-hand shapes. Real ASL also uses movement, both hands and your face.",
    left + 14,
    messageTop + 24,
  );
  pop();
}

//*levels* the screen at the end of a level: the score, which sentences you finished in time, and what Enter does next.
function drawLevelDone(left, top, panelWidth, panelHeight) {
  let level = levels[levelIndex];
  let learned = sentenceResults.filter((result) => result).length;
  let lastLevel = levelIndex + 1 === levels.length;

  fill(...gameInk);
  textSize(14);
  textStyle(BOLD);
  text("LEVEL " + (levelIndex + 1) + " of " + levels.length + "  ·  " + level.name + "  ·  done!", left + 14, top + 12);
  textSize(30);
  text("Score: " + score, left + 14, top + 36);
  textStyle(NORMAL);
  textSize(14);
  text(learned + " of " + level.sentences.length + " signed in time", left + 14, top + 80);

  for (let i = 0; i < level.sentences.length; i++) {
    let mark = sentenceResults[i] ? "✓" : "✗";
    text(mark + "  " + level.sentences[i].sentence, left + 14, top + 108 + i * 20);
  }

  let next;
  if (!levelPassed()) {
    next = "Not quite half yet. Press Enter to try level " + (levelIndex + 1) + " again.";
  } else if (lastLevel) {
    next = "You finished all " + levels.length + " levels! Press Enter to play again from level 1.";
  } else {
    next = "Level passed! Press Enter for level " + (levelIndex + 2) + ".";
  }
  textStyle(BOLD);
  text(next, left + 14, top + panelHeight - 30);
  textStyle(NORMAL);
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
    this.highlightColor = color(255, 170, 205); //the colour it shows when clicked or on the person. //*game* was red, now a pastel pink
    this.clicked = false; //mousePressed() flips this.
    this.onBody = false; //true while the ball is over the person. draw() sets it every frame.
    //*change* smoother body outline: goes up towards 1 while the ball is on the person, down towards 0 when not.
    //the ball only turns red once it's past halfway, so balls on the edge of your outline don't flicker.
    this.bodyAmount = 0;

    //*smile* the brighter colours it turns into when you smile. worked out once here, not every frame.
    this.brightOriginal = brighter(this.originalColor);
    this.brightHighlight = brighter(this.highlightColor);
    this.brightColor = this.brightOriginal; //the bright version of whichever colour it has right now.

    //*smile* each ball is a little flower bud that opens when you smile.
    this.bloom = 0; //0 = a closed bud (it looks like a ball), 1 = wide open.
    this.bloomSpeed = random(0.04, 0.15); //each one opens at its own speed, so they ripple open instead of all at once.
    this.turn = random(TWO_PI); //each one is turned a different way, so they don't all look the same.

    //*eat* eating.
    this.eaten = false; //eatBalls() sets this. the ball shrinks away, then gets removed from the array.
    this.grow = 1; //how much of its size it has: 1 = all, 0 = none. shrinks when eaten, grows in when it comes back.

    //the pulse: each ball gets its own speed and its own starting point, so they don't all pulse together.
    this.pulseSpeed = random(0.03, 0.1);
    this.pulseStart = random(TWO_PI);
  }

  //the radius right now. sin() goes smoothly from -1 to 1 and back,
  //so this goes from pulseAmount smaller to pulseAmount bigger and back.
  //*eat* grow shrinks it towards nothing when it's eaten.
  size() {
    let pulsing =
      this.r + sin(pulseTime * this.pulseSpeed + this.pulseStart) * pulseAmount;
    return pulsing * this.grow;
  }

  //*eat* true once an eaten ball has shrunk to almost nothing, so it can be taken out of the array.
  gone() {
    return this.eaten && this.grow < 0.05;
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
    this.grow = lerp(this.grow, this.eaten ? 0 : 1, 0.15); //*eat*
    this.bloom = lerp(this.bloom, smile, this.bloomSpeed); //*smile* opens as you smile, closes when you stop.

    if (this.clicked || this.bodyAmount > 0.5) {
      this.highlight();
    } else {
      this.dehighlight();
    }
  }

  highlight() {
    this.color = this.highlightColor;
    this.brightColor = this.brightHighlight; //*smile*
  }

  dehighlight() {
    this.color = this.originalColor;
    this.brightColor = this.brightOriginal; //*smile*
  }

  //*smile* a closed bud is just a ball. as it blooms, its petals spread out from the middle,
  //get brighter, and a yellow centre shows.
  show() {
    let r = this.size();
    noStroke();

    //closed: one circle. (this also saves time, since drawing petals for thousands of balls is slow.)
    if (this.bloom < 0.02) {
      fill(this.color);
      circle(this.x, this.y, r * 2);
      return;
    }

    //the petals: 5 circles that start on top of each other (a ball) and move outwards as it opens.
    fill(lerpColor(this.color, this.brightColor, this.bloom));
    let spread = r * 1.2 * this.bloom; //how far each petal has moved out from the middle.
    let petalSize = r * (1.2 + 0.8 * this.bloom); //the petals grow a little as they open.
    for (let i = 0; i < flowerPetals; i++) {
      let angle = this.turn + (TWO_PI * i) / flowerPetals;
      circle(this.x + cos(angle) * spread, this.y + sin(angle) * spread, petalSize);
    }

    //the yellow middle, growing in as it opens.
    fill(255, 220, 120);
    circle(this.x, this.y, r * 1.2 * this.bloom);
  }
}
