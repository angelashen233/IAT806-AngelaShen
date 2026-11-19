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
// - *endless* after level 3 it never ends: each new level teaches a theme of words (Fruit, Drinks, ...), signing
//   each word and then spelling its first letter. the themes come round again with no hints and less time.
// - *api* in levels 1 and 2, a box shows the real ASL sign as a moving stick figure. it comes from sign.mt's free API.
// - *eat* in game mode, each sign you finish eats some of the balls on your body (splice), from your hand outwards.
//   they come back (push) for the next sentence.
// - *smile* face-api.js watches your face. when you smile, every ball blooms into a little flower, brighter and more
//   colourful the bigger the smile. stop smiling and they close back into balls.
// - *sound* sound effects: a whoosh when a hand shows up, a chime for each correct sign, and a level up sound when you pass a level.
// - *flower* when you pass a level, a flower opens behind you and the balls turn off until the next level.
// - *ui* practice and game mode share one look: narrow see-through pastel cards with wobbly corners, and pastel
//   hand-shaped buttons. the Help button hides the practice instructions so they don't cover you.
//   with help on, the sign it recognises floats above your hand, and the demo box plays its real ASL sign.
// - *letters* it reads ASL alphabet letters (A to Y, not J or Z) from your hand points, with no teaching needed.
// - *chart* the ABC button shows an ASL alphabet chart on the left, to copy the hand shapes from.
// - *model* practice mode reads letters A to Z with a trained model (Muhib Mehdi's); the game still uses the rules.
// - *mirror* the camera is shown like a mirror.
// - *fix* the Fix button pauses the game so you can teach it how your hand makes letters it reads wrong.
// - *j* J is spotted from its movement: an I, then a swing of the pinky.
// - *numbers* the Read button switches practice mode to reading numbers 0 to 9.
// - *notes* practice mode writes down what you sign (letters join into words). S saves the record, and the
//   Notes button downloads your saved records as a .txt file.
// - *tears* when face-api reads you as unhappy (sad, angry, scared or disgusted), the balls turn into falling teardrops.
// - *simple* a simpler layout: buttons top-left (space bar pauses), one short help card on the left, and on the
//   right the Notes button, what you've signed, and the real-sign box.
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
// *ui* the hand-shaped buttons: the "hand" icon by loading.io (CC-BY), recoloured, https://loading.io/icon/ckjo44
// *model* the practice letter model: ASL-Recognition-System by Muhib Mehdi (MIT license), weights in
// asl-letter-model.json, https://github.com/Muhib-Mehdi/ASL-Recognition-System
// *letters* the alphabet letter rules: translated from gurkirat20's Sign_Language_Detection (Python, MediaPipe),
// https://github.com/gurkirat20/Sign_Language_Detection
// *chart* the ASL alphabet chart (asl-alphabet.svg): "Asl alphabet gallaudet ann.svg" by Marnanel, based on images by
// Dancor and Ds13, public domain, https://commons.wikimedia.org/wiki/File:Asl_alphabet_gallaudet_ann.svg

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
//*tears* when you look unhappy, the balls turn into falling teardrops, like rain.
let sadTarget = 0; //how unhappy you look in the latest check, 0 to 1 (face-api's sad + angry + fearful + disgusted).
let sadness = 0; //the same, eased every frame.
let sadThreshold = 0.3; //how unhappy you have to look (0 to 1) before the rain starts.
let dripLength = 40; //how far (in pixels) each drop falls before it starts again at its spot.
let rainBlue = [110, 170, 255]; //the colour the drops turn as they fill up.
let smileChecksPerSecond = 10; //how often it looks for your smile. a smile doesn't need more, and it leaves the computer free for hand tracking.
let flowerPetals = 5; //how many petals each little ball-flower has when it blooms.
let flowerSize = 1.7; //how big the open flowers are. 1 = a little bigger than the ball; 2 = they start to touch.

let myBalls = [];
let eatenSpots = []; //*eat* the grid spots of the balls that got eaten, so new balls can come back to the same places.

//the pause button: stops the pulsing and the wobbling, press again to start them.
let paused = false;

//*ui* the panels: soft see-through cards under the hand buttons, in the game's pastel colours.
let helpButton;
let showHelp = true; //the help button flips this. false hides the practice instructions.
let panelTop = 122; //how far down the panels start, so they sit just under the hand buttons.
let panelWidth = 380; //the panels are narrow, so they stay at the side and cover less of you.
let panelAlpha = 215; //how solid the panels are, 0 to 255. lower = more of you shows through.

//*chart* the ASL alphabet chart, shown and hidden with the ABC button.
let chartButton;
let chartBox; //the card on the page that holds the chart picture.
let showChart = false;
let chartWidth = 300; //how wide the chart card is, in pixels. it scrolls if it's taller than the space below it.
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

// ---------------------------------------------------------------------------
// *endless* after the 3 levels above, the game keeps going with WORDS, one theme per level
// (Fruit, Drinks, Animals, Feelings, Family). each word is 2 steps: sign the word, then fingerspell its
// first letter (like APPLE, then A). the real-sign box shows the real sign for each word.
// once you've done every theme, they come round again: no hints, less time, more points. so it never ends.
// the idea of endless practice comes from Gesture Academy's "Random Numbers" game,
// https://github.com/Narottam04/SignLanguage (MIT license). no code was copied from it.
// like the levels above, the game only checks the HAND SHAPE of each sign (shape: or letter:),
// and the "how" text says what the real sign does (movement, where it goes).
// ---------------------------------------------------------------------------
let mainLevels = levels.length; //the 3 written-out levels. levels after these are endless ones.

//how to fingerspell each letter the words start with. letter: tells the game to check it with the letter rules.
let letterHow = {
  A: "fist, with your thumb up along the side of your index finger",
  B: "flat hand, fingers together and up, thumb folded across your palm",
  C: "curve your hand like the letter C",
  D: "index finger up, the other fingertips touch your thumb",
  F: "thumb and index finger touch in a circle, the other 3 fingers up",
  G: "index finger and thumb point sideways, like pinching something flat",
  H: "index and middle fingers together, pointing sideways",
  L: "index finger up and thumb out, like an L",
  M: "fist with your thumb tucked under your first 3 fingers",
  O: "all your fingertips curve round to touch your thumb, like an O",
  S: "fist with your thumb across the front of your fingers",
  T: "fist with your thumb tucked between your index and middle fingers",
  W: "index, middle and ring fingers up, thumb holds your pinky down",
};

//the step for fingerspelling one letter.
function spellStep(letter) {
  return { sign: "spell " + letter, letter: letter, emoji: letter, how: letterHow[letter] };
}

//the themes. each word: its sign (checked by shape: or by the letter its hand shape matches), an emoji, and how.
let themes = [
  {
    name: "Fruit",
    words: [
      { sign: "APPLE", letter: "X", emoji: "\u{1F34E}", how: "X hand (index finger bent like a hook): twist its knuckle on your cheek" },
      { sign: "BANANA", shape: "point", emoji: "\u{1F34C}", how: "index finger up (your other hand peels down it, like a banana)" },
      { sign: "ORANGE", letter: "S", emoji: "\u{1F34A}", how: "a fist at your chin that squeezes open and closed" },
      { sign: "FRUIT", letter: "F", emoji: "\u{1F353}", how: "F hand (thumb and index touch, 3 fingers up): twist it on your cheek" },
    ],
  },
  {
    name: "Drinks",
    words: [
      { sign: "CUP", letter: "C", emoji: "\u{1F964}", how: "C hand, sitting on your other flat palm" },
      { sign: "WATER", letter: "W", emoji: "\u{1F4A7}", how: "W hand (3 fingers up): tap your index finger on your chin" },
      { sign: "MILK", shape: "fist", emoji: "\u{1F95B}", how: "a fist that squeezes open and closed, like milking" },
      { sign: "COFFEE", shape: "fist", emoji: "\u{2615}", how: "a fist that grinds in circles on top of your other fist" },
      { sign: "TEA", letter: "F", emoji: "\u{1F375}", how: "thumb and index pinched (like F): dip and stir into your other hand" },
    ],
  },
  {
    name: "Animals",
    words: [
      { sign: "CAT", letter: "F", emoji: "\u{1F431}", how: "F hand at your cheek: pull it out, like stroking whiskers" },
      { sign: "DOG", shape: "flat", emoji: "\u{1F436}", how: "flat hand: pat your leg (then snap), like calling a dog" },
      { sign: "BIRD", letter: "G", emoji: "\u{1F426}", how: "G hand at your mouth: index and thumb open and close like a beak" },
      { sign: "FISH", shape: "flat", emoji: "\u{1F41F}", how: "flat hand sideways, wiggling forward like a swimming fish" },
    ],
  },
  {
    name: "Feelings",
    words: [
      { sign: "HAPPY", shape: "flat", emoji: "\u{1F60A}", how: "flat hand: brush up your chest, twice" },
      { sign: "SAD", shape: "flat", emoji: "\u{1F622}", how: "open hand: slide it down in front of your face" },
      { sign: "LOVE", shape: "fist", emoji: "\u{2764}\u{FE0F}", how: "fists crossed over your heart" },
      { sign: "GOOD", shape: "flat", emoji: "\u{1F44D}", how: "flat hand: from your chin, move it forward and down" },
    ],
  },
  {
    name: "Family",
    words: [
      { sign: "MOM", shape: "flat", emoji: "\u{1F469}", how: "open hand, fingers spread: tap your thumb on your chin" },
      { sign: "DAD", shape: "flat", emoji: "\u{1F468}", how: "open hand, fingers spread: tap your thumb on your forehead" },
      { sign: "FRIEND", letter: "X", emoji: "\u{1F91D}", how: "X hands (bent index fingers): hook them together, then swap" },
      { sign: "HOME", letter: "O", emoji: "\u{1F3E0}", how: "fingertips together (flat O): touch your mouth, then your cheek" },
    ],
  },
];

//makes endless level number n (4, 5, 6, ...): the next theme, one word per "sentence".
function makeEndlessLevel(n) {
  let extra = n - mainLevels - 1; //0 for level 4, 1 for level 5, ...
  let theme = themes[extra % themes.length];
  let lap = floor(extra / themes.length); //0 the first time through the themes, 1 the second time, ...
  let sentences = theme.words.map((word) => ({
    sentence: word.sign.charAt(0) + word.sign.slice(1).toLowerCase(), //"APPLE" -> "Apple"
    demo: word.sign.toLowerCase(), //what the real-sign box asks sign.mt for.
    steps: [word, spellStep(word.sign.charAt(0))], //sign the word, then spell its first letter.
  }));
  return {
    name: theme.name,
    seconds: lap === 0 ? 20 : max(8, 15 - (lap - 1) * 2), //less time each time round, but never under 8 seconds.
    points: 200 + extra * 25,
    showHow: lap === 0, //the first time through, it shows how; after that, from memory.
    showDemo: lap === 0, //and the real-sign box only shows the first time, too.
    sentences: sentences,
  };
}

//how the level is named on the panel: "LEVEL 2 of 3" for the written ones, "LEVEL 5 · Drinks" after them.
function levelTitle() {
  if (levelIndex < mainLevels) {
    return "LEVEL " + (levelIndex + 1) + " of " + mainLevels;
  }
  return "LEVEL " + (levelIndex + 1) + " · " + levels[levelIndex].name;
}

//is the hand making this step's sign? a letter is checked with the alphabet rules, the rest by hand shape.
function stepMatches(hand, step) {
  if (step.letter) {
    //*fix* a letter you taught it in Fix mode counts too.
    return aslLetter(hand) === step.letter || taughtLetter() === step.letter;
  }
  return matchesShape(hand, step.shape);
}

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
let demoWords = ""; //*ui* the words the demo box is showing (or loading) right now.

function setup() {
  const canvas = createCanvas(sketch_holder_width(), windowHeight); //full width of the page, full height of the window.

  // Puts the canvas inside the <div id="sketch-holder"> in index.html,
  // instead of dropping it at the bottom of the page.
  canvas.parent("sketch-holder");

  //the button sits on top of the canvas's top-left corner, so it's on screen even though the canvas fills the window.
  select("#sketch-holder").style("position", "relative"); //makes position() below measure from the holder's corner.
  //*ui* the buttons are pastel hands (the "hand-button" style is in index.html), in a row along the top-left.
  //*simple* there's no Pause button any more: the space bar pauses (see keyPressed()), to keep the row short.
  gameButton = makeHandButton("Game: off", "blue", toggleGame);
  helpButton = makeHandButton("Help: on", "pink", toggleHelp); //hides the practice instructions.
  chartButton = makeHandButton("Chart: off", "", toggleChart); //*chart* the ASL alphabet chart.
  makeChartBox();
  fixButton = makeHandButton("Fix: off", "blue", toggleFix); //*fix* teach it how your hand makes a letter.
  readButton = makeHandButton("Read: ABC", "pink", toggleNumbers); //*numbers* letters or numbers.
  placeButtons();

  //*notes* the Notes button, at the top of the right-hand column: downloads your saved translations as a .txt file.
  notesButton = makeHandButton("Notes .txt", "", downloadNotes);
  placeNotesButton();
  makeDemoBox(); //*api*

  makeBalls();
  newSignModel(); //*change*

  //*model* the practice mode letter model's numbers. like the sounds, it's ready a little later.
  fetch("asl-letter-model.json")
    .then((response) => response.json())
    .then((model) => {
      letterModel = model;
    });

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
      //*tears* the unhappy expressions added together (they can't go over 1, since all 7 expressions add up to 1).
      let e = face ? face.expressions : null;
      sadTarget = e ? e.sad + e.angry + e.fearful + e.disgusted : 0;
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
  placeChartBox(); //*chart*
  placeNotesButton(); //*notes*
}

//a random colour somewhere between pastel light blue and pastel light purple.
//*game* was a strong blue (40, 90, 230) and a strong purple (150, 60, 220).
function bluePurple() {
  let blue = color(170, 215, 255);
  let purple = color(210, 185, 255);
  return lerpColor(blue, purple, random(1)); //random(1) = how far along from blue to purple, 0 to 1.
}

//*smile* a p5 colour as 3 plain numbers, [red, green, blue]. the flowers mix these with lerp(),
//which is much faster than lerpColor() when thousands of flowers do it every frame.
function toRGB(c) {
  return [red(c), green(c), blue(c)];
}

//*smile* a brighter, more colourful version of a colour (as [red, green, blue]). it pushes red, green and blue
//further apart (more colourful), then lifts them all so the strongest one is 255 (brighter).
function brighter(c) {
  let [r, g, b] = toRGB(c);
  let average = (r + g + b) / 3;
  r = constrain(average + (r - average) * 2.5, 0, 255);
  g = constrain(average + (g - average) * 2.5, 0, 255);
  b = constrain(average + (b - average) * 2.5, 0, 255);
  let lift = 255 / max(r, g, b, 1);
  return [r * lift, g * lift, b * lift];
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
    x: videoToCanvasX(middleX, fit), //*mirror*
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
  drawCameraImage(flower, fit); //*mirror* mirrored like the camera, so it stays lined up with you.
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

// ---------------------------------------------------------------------------
// *mirror* the camera is shown like a mirror: raise your right hand and the one on the right of the screen moves.
// only the picture is flipped. the hand, body and face tracking still look at the camera the normal way round
// (the letter readers were made for that), so these turn camera positions into mirrored screen positions.
// ---------------------------------------------------------------------------
let mirrorView = true; //false shows the camera the normal way round, like before.

//a camera x position (in camera pixels) -> where it is on the canvas.
function videoToCanvasX(x, fit) {
  return (mirrorView ? video.width - x : x) * fit.scale + fit.offsetX;
}

//a canvas x position -> where it is in the camera picture (the other way round from above).
function canvasToVideoX(canvasX, fit) {
  let x = (canvasX - fit.offsetX) / fit.scale;
  return mirrorView ? video.width - x : x;
}

//draws the camera (or anything the camera's size, like the flower) to fill the canvas, mirrored if mirrorView is on.
//flipping the whole canvas left-right puts it back in the same spot, because it's centred.
function drawCameraImage(picture, fit) {
  push();
  if (mirrorView) {
    translate(width, 0);
    scale(-1, 1);
  }
  image(picture, fit.offsetX, fit.offsetY, video.width * fit.scale, video.height * fit.scale);
  pop();
}

//order: the masked video first, then the balls on top of it, then the hand and the sign text on top of everything.
function draw() {
  //background(0);
  //*ui* wipes last frame, so the see-through panels don't pile up into solid black where nothing else draws.
  clear();

  if (!paused) {
    pulseTime += 1;
  }

  let fit;
  //*ui* the camera shows as soon as it has a picture (readyState 2 or more), instead of waiting for the body
  //model to download, which can take a while on a slow connection.
  if (video && video.elt.readyState >= 2) {
    fit = videoFit();
    //*eat* shows the whole camera, so you can see yourself (and the flower can open behind you).
    //*ui* practice mode used to mask you out of the video, which left a white shape where you were. now both
    //modes show you. the mask is still used to find the balls on your body and to put the flower behind you.
    drawCameraImage(video, fit); //*mirror*
  }
  if (segmentation && fit) {
    segmentation.mask.loadPixels(); //once per frame, so every ball can read the mask quickly.
    //*flower* passed a level: a flower opens behind you, drawn over the room but not over you.
    if (flowerShowing()) {
      drawFlower(fit);
    }
  }

  smile = lerp(smile, smileTarget, 0.1); //*smile*
  sadness = lerp(sadness, sadTarget, 0.1); //*tears*

  for (let ball of myBalls) {
    //*flower* the balls are turned off while the flower is open. they come back with the next level.
    if (flowerShowing()) {
      break;
    }
    if (segmentation && fit) {
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
    guessSign(); //*fix* so letters you taught in Fix mode count in the game too.
    if (fixing) {
      collectSample(); //*fix* the game waits (updateGame isn't called) while you teach it.
    } else {
      updateGame();
    }
    drawHand();
    if (fixing) {
      drawFixPanel(); //*fix*
    } else {
      drawGamePanel();
    }
    return;
  }

  //*change* hand gesture recognition
  collectSample();
  guessSign();
  shownLetter = steadyLetter(); //*letters*
  drawHand();
  drawSignPanel();
  if (fixing) {
    drawFixPanel(); //*fix*
  }
  drawHandLabel(); //*ui*
  updatePracticeDemo(); //*ui*
  updateTranslation(); //*notes*
  drawTranslation(); //*notes*
}

// ---------------------------------------------------------------------------
// *fix* FIX MODE: when it keeps reading a letter wrong (like M, or N read as A), teach it how YOUR hand makes it.
// it uses the same teaching as practice mode (hold a letter's key, then Enter), and pauses the game while it's on.
// what you teach decides between the letters you taught; every other letter is still read the usual way.
// ---------------------------------------------------------------------------
let fixButton;
let fixing = false;

function toggleFix() {
  fixing = !fixing;
  fixButton.html(fixing ? "Fix: on" : "Fix: off");
  placeChartBox(); //the chart moves aside, so you can see the Fix panel and the chart together.
}

//a letter you taught it, if it's sure it sees one right now. "" if not.
function taughtLetter() {
  if (modelState !== "ready" || !shownGuess || shownGuess.confidence < complimentConfidence) {
    return "";
  }
  return findCompliment(shownGuess.label) ? "" : shownGuess.label;
}

//the Fix mode panel, on the left where the instructions (or the game panel) usually go.
function drawFixPanel() {
  let w = min(panelWidth, width - 32);
  let lines = [
    "1. make the letter it gets wrong, like M",
    "2. hold its key (M), moving your hand a little, for 50+ saves",
    "3. teach the letters it mixes it up with too (like N and A)",
    "4. press Enter to learn them. Backspace = start over.",
    "",
  ];
  let taught = Object.entries(sampleCounts).map((entry) => entry[0] + ": " + entry[1]);
  if (modelState === "collecting") {
    lines.push(taught.length > 0 ? "saved: " + taught.join("   ") : "nothing saved yet");
  } else if (modelState === "training") {
    lines.push("learning... round " + trainingRound + " of " + trainingRounds);
  } else {
    lines.push("learned! your letters: " + Object.keys(sampleCounts).join(", "));
  }
  if (warning) {
    lines.push(warning);
  }
  //what each reader sees right now, so you can tell which one is wrong.
  let readers = gameOn ? "game rules: " + (smoothHand ? aslLetter(smoothHand) || "?" : "-") : "model: " + (shownLetter || "?");
  lines.push(readers + "   ·   yours: " + (taughtLetter() || "?"));
  lines.push("");
  lines.push("AI readings can be wrong: the letter model missed about");
  lines.push("1 in 5 on its own test. M, N, A, S, T and E look alike to it.");

  let boxHeight = 50 + lines.length * 18 + (warning ? 18 : 0);
  push();
  noStroke();
  fill(...gamePaper, panelAlpha);
  softPanel(16, panelTop, w, boxHeight);
  fill(...gameInk);
  textAlign(LEFT, TOP);
  textSize(14);
  textStyle(BOLD);
  text("FIX MODE: teach it YOUR hand" + (gameOn ? "  (game paused)" : ""), 30, panelTop + 12);
  textStyle(NORMAL);
  textSize(11.5);
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], 30, panelTop + 36 + i * 18, w - 28);
  }
  pop();
}

// ---------------------------------------------------------------------------
// *numbers* READING NUMBERS 0 TO 9 (practice mode)
// the letter model only knows A to Z, and ASL numbers share hand shapes with letters (2 looks like V, 6 like W,
// 9 like F), so numbers have their own switch: the Read button. these rules look at which fingers are up
// (fingersUp(), from the game) and which fingertip the thumb is touching.
// ---------------------------------------------------------------------------
let readButton;
let readNumbers = false; //false = read letters, true = read numbers.

function toggleNumbers() {
  readNumbers = !readNumbers;
  readButton.html(readNumbers ? "Read: 123" : "Read: ABC");
  letterHistory = []; //start fresh, so a letter doesn't turn into a number.
}

//which number 0 to 9 is this hand showing? "" if none.
function handNumber(hand) {
  let p = hand.keypoints;
  let handSize = dist(p[0].x, p[0].y, p[9].x, p[9].y);
  //is the thumb tip touching this fingertip? (closer than a third of the hand's size)
  let touching = (tip) => dist(p[4].x, p[4].y, p[tip].x, p[tip].y) < handSize * 0.35;
  let up = fingersUp(hand); //thumb, index, middle, ring, pinky
  let fingers = up.slice(1).map((isUp) => (isUp ? "1" : "0")).join(""); //index, middle, ring, pinky, like "1100"

  if (fingers === "0000" && touching(8)) return "0"; //all fingers curled round to the thumb, like an O
  if (fingers === "1000" && !up[0]) return "1"; //index up
  if (fingers === "1100" && !up[0]) return "2"; //index and middle up
  if (fingers === "1100" && up[0]) return "3"; //thumb, index and middle up
  if (fingers === "1111" && !up[0]) return "4"; //4 fingers up, thumb tucked in
  if (fingers === "1111" && up[0]) return "5"; //everything up
  if (fingers === "1110" && touching(20)) return "6"; //thumb touches pinky
  if (fingers === "1101" && touching(16)) return "7"; //thumb touches ring finger
  if (fingers === "1011" && touching(12)) return "8"; //thumb touches middle finger
  if (fingers === "0111" && touching(8)) return "9"; //thumb touches index finger
  return "";
}

// ---------------------------------------------------------------------------
// *notes* THE TRANSLATION RECORD (practice mode)
// what you sign is written down as you go: letters join into words, a compliment adds its sentence,
// and putting your hand down for a second adds a space. press S to save that record and start a new one.
// the Notes button (bottom-right) downloads everything you saved as a .txt file.
// ---------------------------------------------------------------------------
let notesButton;
let translation = ""; //the record being written right now.
let recordStart = new Date(); //when it started.
let savedRecords = []; //the records saved with S: { start, end, text }.
let writeSeconds = 0.6; //how long a sign has to be held before it's written down, so passing shapes don't count.
let signHeld = ""; //the sign being held right now...
let signHeldSince = 0; //...and since when (in millis).
let lastWritten = ""; //the last sign written down, so holding one sign writes it once.
let handGoneSince = 0; //when the hand left the camera (in millis), or 0 while it's there.
let savedMessageUntil = 0; //shows "saved!" until this time.

//runs every frame in practice mode: writes down signs you hold, and adds spaces between words.
function updateTranslation() {
  if (!smoothHand) {
    if (handGoneSince === 0) {
      handGoneSince = millis();
    }
    //hand down for a second: end of a word.
    if (millis() - handGoneSince > 1000 && translation !== "" && !translation.endsWith(" ")) {
      translation += " ";
    }
    signHeld = "";
    lastWritten = "";
    return;
  }
  handGoneSince = 0;

  let sign = currentHandSign();
  let words = sign ? sign.words : "";
  if (words !== signHeld) {
    signHeld = words; //a new sign: start timing it.
    signHeldSince = millis();
    return;
  }
  let heldLongEnough = millis() - signHeldSince > writeSeconds * 1000;
  if (!heldLongEnough) {
    return;
  }
  if (words === "") {
    lastWritten = ""; //a relaxed hand in between lets you write the same letter twice, like the L L in HELLO.
  } else if (words !== lastWritten) {
    let isSentence = words.length > 1; //a compliment's sentence, not a single letter or number.
    if (isSentence) {
      translation += (translation === "" || translation.endsWith(" ") ? "" : " ") + words + " ";
    } else {
      translation += words;
    }
    lastWritten = words;
  }
}

//S: saves the record so far and starts a new one.
function saveRecord() {
  if (translation.trim() === "") {
    return;
  }
  savedRecords.push({ start: recordStart, end: new Date(), text: translation.trim() });
  translation = "";
  recordStart = new Date();
  savedMessageUntil = millis() + 1500;
}

//the record so far, in a strip along the bottom of the canvas (left of the Notes button).
//*simple* the right-hand column, from the top: the Notes button, this card, then the real-sign box.
//it used to be a strip along the bottom, where it could end up behind you; now it's all together on the right.
let rightColumnWidth = 260; //the same width as the real-sign box, so they line up.
let notesCardTop = 122; //just under the Notes button.
let notesCardHeight = 92;

function drawTranslation() {
  let left = width - rightColumnWidth - 16;
  let w = rightColumnWidth;
  let top = notesCardTop;
  let shown = translation.length > 60 ? "..." + translation.slice(-60) : translation; //the end, if it's long.

  push();
  noStroke();
  fill(...gamePaper, panelAlpha);
  softPanel(left, top, w, notesCardHeight);
  fill(...gameInk);
  textAlign(LEFT, TOP);
  textSize(11);
  textStyle(BOLD);
  text("WHAT YOU SIGNED", left + 14, top + 10);
  textSize(15);
  text(shown || "...", left + 14, top + 28, w - 28); //wraps onto 2 lines if it needs to.
  textStyle(NORMAL);
  textSize(11);
  let status = millis() < savedMessageUntil ? "saved!" : "S = save";
  text(status + "  ·  " + savedRecords.length + " saved  ·  Notes = download", left + 14, top + notesCardHeight - 22);
  pop();
}

//the Notes button sits at the top of the right-hand column.
function placeNotesButton() {
  notesButton.position(width - 100, 10);
}

//downloads every saved record (and the one you're writing now) as a .txt file.
function downloadNotes() {
  let time = (date) => date.toLocaleTimeString();
  let lines = ["Sign language notes, " + new Date().toLocaleString(), ""];
  savedRecords.forEach((record, i) => {
    lines.push("Record " + (i + 1) + " (" + time(record.start) + " to " + time(record.end) + "):");
    lines.push(record.text);
    lines.push("");
  });
  if (translation.trim() !== "") {
    lines.push("Not saved yet (" + time(recordStart) + " to " + time(new Date()) + "):");
    lines.push(translation.trim());
    lines.push("");
  }
  if (lines.length === 2) {
    lines.push("Nothing recorded yet. Sign in practice mode, then press S to save a record.");
  }
  lines.push("These are AI readings, so some letters may be wrong.");

  //makes a file in the browser and clicks a hidden link to download it.
  let file = new Blob([lines.join("\n")], { type: "text/plain" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "sign-notes.txt";
  link.click();
  URL.revokeObjectURL(link.href);
}

//*sound* plays a sound, but only once it has loaded (before that, the variable is still undefined).
//*fix* also waits until sound is allowed: browsers block it until the first click, and trying before that
//threw an error (the "hand found" sound often comes before any click).
function playSound(sound) {
  if (sound && getAudioContext().state === "running") {
    sound.play();
  }
}

// callback function for body segmentation: ml5 calls this with each new mask.
function gotResults(result) {
  segmentation = result;
}

//*ui* shows or hides the practice instructions.
function toggleHelp() {
  showHelp = !showHelp;
  helpButton.html(showHelp ? "Help: on" : "Help: off");
}

//*chart* shows or hides the alphabet chart.
function toggleChart() {
  showChart = !showChart;
  chartButton.html(showChart ? "Chart: on" : "Chart: off");
  if (showChart) {
    chartBox.show();
    placeChartBox();
  } else {
    chartBox.hide();
  }
}

//*chart* makes the chart card once, in setup(). like the demo box, it's a page element on top of the canvas,
//so the picture stays sharp and the card can scroll.
//the chart: "ASL alphabet (Gallaudet), annotated", public domain, from Wikimedia Commons (see REFERENCES).
function makeChartBox() {
  chartBox = createDiv("");
  chartBox.parent("sketch-holder");
  chartBox.style("position", "absolute");
  chartBox.style("box-sizing", "border-box");
  chartBox.style("width", chartWidth + "px");
  chartBox.style("padding", "10px");
  chartBox.style("overflow-y", "auto"); //scrolls when the window is too short for the whole chart.
  chartBox.style("border-radius", "22px 12px 26px 10px"); //uneven corners, like the other panels.
  chartBox.style("background", "rgba(240, 235, 255, 0.92)");
  chartBox.style("color", "rgb(70, 55, 120)");
  chartBox.style("font-size", "11px");

  let title = createDiv("<b>ASL ALPHABET</b> (palm forward unless the chart says otherwise)");
  title.parent(chartBox);
  title.style("margin-bottom", "6px");
  let picture = createImg("asl-alphabet.svg", "The ASL alphabet A to Z and numbers 0 to 9, one drawn hand shape for each");
  picture.parent(chartBox);
  picture.style("width", "100%");
  picture.style("display", "block");
  let credit = createDiv("Chart: public domain, Wikimedia Commons");
  credit.parent(chartBox);
  credit.style("margin-top", "4px");

  chartBox.hide();
}

//*chart* in practice mode it goes where the instructions are (they hide while it's open);
//in game mode it goes under the game panel. it never runs off the bottom of the canvas: it scrolls instead.
function placeChartBox() {
  let top = gameOn && !fixing ? panelTop + gamePanelHeight() + 12 : panelTop;
  let left = fixing ? 16 + min(panelWidth, width - 32) + 12 : 16; //*fix* beside the Fix panel, not on top of it
  chartBox.position(left, top);
  chartBox.style("max-height", max(120, height - top - 16) + "px");
}

//*ui* a panel with uneven corners that slowly wobble, like the balls pulse. call fill() first.
function softPanel(x, y, w, h) {
  let t = pulseTime * 0.03;
  rect(x, y, w, h, 18 + sin(t) * 5, 10 + sin(t + 1.7) * 4, 22 + sin(t + 3.1) * 5, 9 + sin(t + 4.4) * 4);
}

//*simple* every hand button, so they can be laid out and clicked the same way.
let handButtons = [];

//makes one pastel hand button. colour is "", "blue" or "pink" (the styles are in index.html).
function makeHandButton(label, colour, whenClicked) {
  let button = createButton(label);
  button.parent("sketch-holder");
  button.class(("hand-button " + colour).trim());
  button.mousePressed(whenClicked);
  handButtons.push(button);
  return button;
}

//*simple* puts the top-left buttons in a row, skipping hidden ones, so there are no gaps.
//(in game mode, Help and Read are hidden.)
function placeButtons() {
  let x = 16;
  for (let button of [gameButton, helpButton, chartButton, fixButton, readButton]) {
    if (button.elt.style.display !== "none") {
      button.position(x, 10);
      x += 92;
    }
  }
}

//pause: everything freezes where it is. play: it carries on from there. *simple* the space bar does this now.
function togglePause() {
  paused = !paused;
}

//click a ball to turn it red. click it again to turn it back.
function mousePressed(event) {
  userStartAudio(); //*sound* browsers block sound until the user clicks; this switches it on.

  //clicks on the buttons come here too. this skips them, so the ball under a button doesn't turn red.
  //*chart* clicks (or scrolls) on the chart card count as on a button too.
  let onButton =
    event && (handButtons.some((button) => button.elt === event.target) || chartBox.elt.contains(event.target));
  if (onButton) {
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
    smoothHand = {
      keypoints: newPoints.map((point) => ({ x: point.x, y: point.y })),
      handedness: hands[0].handedness, //*letters*
    };
    return;
  }
  //lerp moves each smoothed point part of the way (handSmoothing) towards where the hand is now.
  for (let i = 0; i < newPoints.length; i++) {
    smoothHand.keypoints[i].x = lerp(smoothHand.keypoints[i].x, newPoints[i].x, handSmoothing);
    smoothHand.keypoints[i].y = lerp(smoothHand.keypoints[i].y, newPoints[i].y, handSmoothing);
  }
  smoothHand.handedness = hands[0].handedness; //*letters* "Left" or "Right", so aslLetter() can tell which hand it is.
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
  //*notes* letters are only taught in Fix mode, so letter keys like S (save) are free the rest of the time.
  if (key.length === 1 && /[a-z]/i.test(key) && fixing) {
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

// ---------------------------------------------------------------------------
// *letters* ASL ALPHABET LETTERS, WITH NO TEACHING NEEDED
// translated from Python to JavaScript from gurkirat20's Sign_Language_Detection (main.py),
// https://github.com/gurkirat20/Sign_Language_Detection
// it uses MediaPipe's 21 hand points, and ml5's handPose is MediaPipe's hand model too, with the same point
// numbers (0 = wrist, 4 = thumb tip, 8 = index tip, 12 = middle tip, 16 = ring tip, 20 = pinky tip).
// it's a list of rules about where the fingertips are, so it knows A to Y without being taught
// (not J or Z, since those letters move). it works best with your right hand, palm facing the camera.
// *model* the game uses these rules; practice mode uses the trained model below instead.
// ---------------------------------------------------------------------------
let letterHistory = []; //the last few letters it read, so one odd frame doesn't change the letter shown.
let lettersToKeep = 8;

//which letter is this hand making? "" if it doesn't match any.
function aslLetter(hand) {
  let p = hand.keypoints;

  //*fix* the rules were written for a RIGHT hand, palm facing the camera. a left hand is the mirror image, so every
  //"is the thumb left or right of this finger" rule came out backwards. so a left hand is flipped left-right
  //(around the wrist) first, to look like a right hand.
  //(the hand model labels hands as if the camera picture were mirrored, and ours isn't, so "Right" means your left hand.)
  if (hand.handedness === "Right") {
    let wristX = p[0].x;
    p = p.map((point) => ({ x: 2 * wristX - point.x, y: point.y }));
  }

  //*fix* the original's pixel distances (25 and 50) only suited one distance from the camera. now they grow and
  //shrink with your hand: s is how big your hand looks (wrist to middle knuckle), compared to 90 pixels.
  let s = dist(p[0].x, p[0].y, p[9].x, p[9].y) / 90;

  //each finger (index, middle, ring, pinky): 1 = up, 0 = folded down, 0.5 = bent, 0.25 = pointing sideways.
  //(a finger that matches none of these gets nothing, just like the original.)
  let fingers = [];
  let fingerJoint1 = [6, 10, 14, 18];
  let fingerJoint2 = [7, 11, 15, 19];
  let fingerTip = [8, 12, 16, 20];
  for (let i = 0; i < 4; i++) {
    let tip = p[fingerTip[i]];
    let joint1 = p[fingerJoint1[i]];
    let joint2 = p[fingerJoint2[i]];
    if (tip.x + 25 * s < joint1.x && p[16].y < p[20].y) {
      fingers.push(0.25);
    } else if (tip.y > joint1.y) {
      fingers.push(0);
    } else if (tip.y < joint2.y) {
      fingers.push(1);
    } else if (tip.x > joint2.x && tip.x > joint1.x) {
      fingers.push(0.5);
    }
  }
  let count = (value) => fingers.filter((finger) => finger === value).length;

  //the rules, checked in order. the first one that matches wins.
  if (p[3].y > p[4].y && p[3].x > p[6].x && p[4].y < p[6].y && count(0) === 4) return "A";
  if (p[3].x > p[4].x && count(1) === 4) return "B";
  if (p[3].x > p[6].x && count(0.5) >= 1 && p[4].y > p[8].y) return "C";
  if (fingers[0] === 1 && count(0) === 3 && p[3].x > p[4].x) return "D";
  if (p[3].x < p[6].x && count(0) === 4 && p[12].y < p[4].y) return "E";
  if (count(1) === 3 && fingers[0] === 0 && p[3].y > p[4].y) return "F";
  if (fingers[0] === 0.25 && count(0) === 3) return "G";
  if (fingers[0] === 0.25 && fingers[1] === 0.25 && count(0) === 2) return "H";
  if (p[4].x < p[6].x && count(0) === 3) return fingers.length === 4 && fingers[3] === 1 ? "I" : "";
  if (p[4].x < p[6].x && p[4].x > p[10].x && count(1) === 2) return "K";
  if (fingers[0] === 1 && count(0) === 3 && p[3].x < p[4].x) return "L";
  if (p[4].x < p[16].x && count(0) === 4) return "M";
  if (p[4].x < p[12].x && count(0) === 4) return "N";
  if (p[4].x > p[12].x && p[4].y < p[6].y && count(0) === 4) return "T";
  if (p[4].x > p[12].x && p[4].y < p[12].y && count(0) === 4) return "S";
  if (p[4].y < p[8].y && p[4].y < p[12].y && p[4].y < p[16].y && p[4].y < p[20].y) return "O";
  if (fingers[2] === 0 && p[4].y < p[12].y && p[4].y > p[6].y) return fingers.length === 4 && fingers[3] === 0 ? "P" : "";
  if (fingers[1] === 0 && fingers[2] === 0 && fingers[3] === 0 && p[8].y > p[5].y && p[4].y < p[1].y) return "Q";
  if (p[8].x < p[12].x && count(1) === 2 && p[9].x > p[4].x) return "R";
  if (p[4].x < p[6].x && p[4].x < p[10].x && count(1) === 2 && p[3].y > p[4].y && p[8].x - p[11].x <= 50 * s) return "U";
  if (p[4].x < p[6].x && p[4].x < p[10].x && count(1) === 2 && p[3].y > p[4].y) return "V";
  if (p[4].x < p[6].x && p[4].x < p[10].x && count(1) === 3) return "W";
  if (fingers[0] === 0.5 && count(0) === 3 && p[4].x > p[6].x) return "X";
  if (count(0) === 3 && p[3].x < p[4].x) return fingers.length === 4 && fingers[3] === 1 ? "Y" : "";
  return "";
}

// ---------------------------------------------------------------------------
// *model* PRACTICE MODE LETTERS: A TRAINED MODEL
// practice mode reads letters with Muhib Mehdi's trained model from ASL-Recognition-System (MIT license),
// https://github.com/Muhib-Mehdi/ASL-Recognition-System . it learned A to Z from thousands of hand photos, so it's
// more accurate than the rules above (those are still used by the game). its numbers (weights) were copied from
// its keypoint_classifier.keras file into asl-letter-model.json, and the code below does the same maths in JavaScript.
// it looks at one moment at a time, so J and Z (which move) are its weakest letters. on a sample of its own
// training data it got about 81% right (its author reports 97%), so expect the odd wrong letter.
// ---------------------------------------------------------------------------
let letterModel; //the model's numbers. loaded in setup(), and undefined until then.
let modelConfidence = 0.6; //how sure the model has to be (0 to 1) before a letter counts.

//the 42 numbers the model takes, made the same way as its original Python code (pre_process_landmark):
//each point measured from the wrist, as x, y, x, y, ..., then all divided by the biggest one, so hand size doesn't matter.
function handToModelInputs(hand) {
  let p = hand.keypoints;
  //it learned from photos of RIGHT hands, not mirrored (in its training data the thumb side is on the right of the
  //picture), which is how our camera sees a right hand. so a left hand is flipped left-right to look like a right one.
  //(the hand model labels hands as if the camera picture were mirrored, so "Right" means your left hand.)
  let flip = hand.handedness === "Right";
  let numbers = [];
  for (let point of p) {
    let x = point.x - p[0].x;
    let y = point.y - p[0].y;
    numbers.push(flip ? -x : x, y);
  }
  let biggest = max(numbers.map((n) => abs(n)));
  return numbers.map((n) => n / biggest);
}

//mish: the curve the model puts each layer's numbers through. (for big numbers it's just the number itself.)
function mish(x) {
  return x > 20 ? x : x * Math.tanh(Math.log1p(Math.exp(x)));
}

//turns the last layer's numbers into chances that add up to 1.
function softmax(numbers) {
  let biggest = Math.max(...numbers);
  let powers = numbers.map((n) => Math.exp(n - biggest));
  let total = powers.reduce((sum, n) => sum + n, 0);
  return powers.map((n) => n / total);
}

//runs the model: 42 numbers in, a chance (0 to 1) for each letter A to Z out.
//first it evens out the inputs (batch normalisation), then 4 layers that each multiply by their weights and add a bias.
function runLetterModel(inputs) {
  let norm = letterModel.batchNorm;
  let values = inputs.map(
    (v, i) => (norm.gamma[i] * (v - norm.mean[i])) / Math.sqrt(norm.variance[i] + norm.epsilon) + norm.beta[i],
  );
  for (let layer = 0; layer < letterModel.dense.length; layer++) {
    let weights = letterModel.dense[layer].weights;
    let next = letterModel.dense[layer].bias.slice();
    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < next.length; j++) {
        next[j] += values[i] * weights[i][j];
      }
    }
    let lastLayer = layer === letterModel.dense.length - 1;
    values = lastLayer ? softmax(next) : next.map(mish);
  }
  return values;
}

//the model's letter for this hand, or "" if it isn't sure enough (or hasn't loaded yet).
function modelLetter(hand) {
  if (!letterModel) {
    return "";
  }
  let chances = runLetterModel(handToModelInputs(hand));
  let best = chances.indexOf(Math.max(...chances));
  return chances[best] >= modelConfidence ? letterModel.labels[best] : "";
}

//*j* J moves: it's the I hand shape (pinky up), then the pinky swings down and round, like drawing a J.
//one still picture can't show that, so this watches the pinky tip: an I followed by a big pinky swing = J.
let pinkyTrail = []; //where the pinky tip has been in the last moment, measured in hand sizes.
let jSeconds = 1.2; //how long after an I the swing can come.
let jShownUntil = 0; //J stays on screen until this time (in millis), so you can see it after the swing.

//true when it spots the J swing.
function spottedJ(hand, letter) {
  let p = hand.keypoints;
  //measured in hand sizes (wrist to middle knuckle), so it's the same near and far from the camera.
  let handSize = dist(p[0].x, p[0].y, p[9].x, p[9].y);
  pinkyTrail.push({ x: p[20].x / handSize, y: p[20].y / handSize, time: millis(), wasI: letter === "I" });
  pinkyTrail = pinkyTrail.filter((spot) => millis() - spot.time < jSeconds * 1000); //forget older spots.

  //from the first I in the trail: how far did the pinky travel, and how far sideways did it end up?
  let start = pinkyTrail.findIndex((spot) => spot.wasI);
  if (start < 0) {
    return false;
  }
  let travelled = 0;
  for (let i = start + 1; i < pinkyTrail.length; i++) {
    travelled += dist(pinkyTrail[i - 1].x, pinkyTrail[i - 1].y, pinkyTrail[i].x, pinkyTrail[i].y);
  }
  let sideways = abs(pinkyTrail[pinkyTrail.length - 1].x - pinkyTrail[start].x);
  if (travelled > 1 && sideways > 0.35) {
    pinkyTrail = []; //start fresh, so one swing only counts once.
    return true;
  }
  return false;
}

//the letter to show in practice mode: only one that most of the last few readings agree on, so it doesn't flicker.
//"" if none. *model* it reads letters with the trained model above.
function steadyLetter() {
  if (!smoothHand || !video || video.width === 0) {
    letterHistory = [];
    pinkyTrail = []; //*j*
    return "";
  }
  //*numbers* in number mode, it reads numbers instead (and there's no J to spot).
  if (readNumbers) {
    letterHistory.push(handNumber(smoothHand));
  } else {
    letterHistory.push(readLetterWithJ());
  }
  if (letterHistory.length > lettersToKeep) {
    letterHistory.shift(); //forget the oldest one.
  }
  let latest = letterHistory[letterHistory.length - 1];
  let agreeing = letterHistory.filter((letter) => letter === latest).length;
  return latest !== "" && (latest === "J" || agreeing * 2 > letterHistory.length) ? latest : "";
}

//*j* reads a letter with the model, and turns an I followed by a pinky swing into J (shown for a second).
function readLetterWithJ() {
  let letter = modelLetter(smoothHand);
  if (spottedJ(smoothHand, letter)) {
    jShownUntil = millis() + 1000;
  }
  if (millis() < jShownUntil) {
    return "J";
  }
  return letter;
}

//*letters* what the hand is signing right now, for the label above your hand and the demo box:
//a compliment you taught it comes first, then a letter you taught it (it learned those from your own hand,
//so it's more accurate), then an alphabet letter from the rules above. null if none.
function currentHandSign() {
  let compliment = currentCompliment();
  if (compliment) {
    return { label: compliment.emoji, words: compliment.sentence };
  }
  //*fix* a letter you taught it wins when the model is unsure, or when the model reads another letter you taught
  //(that's the mix-up you were correcting, like N read as A). other letters stay with the model.
  let yours = taughtLetter();
  if (yours && (!shownLetter || sampleCounts[shownLetter] !== undefined)) {
    return { label: yours, words: yours };
  }
  if (shownLetter) {
    return { label: shownLetter, words: shownLetter };
  }
  return null;
}
let shownLetter = ""; //the steady letter this frame. draw() updates it once per frame, in practice mode.

//*change* the compliment it's showing right now, but only if it's sure enough. otherwise undefined.
function currentCompliment() {
  if (modelState !== "ready" || !shownGuess || shownGuess.confidence < complimentConfidence) {
    return undefined;
  }
  return findCompliment(shownGuess.label);
}

//*change* Enter: train on the examples. Backspace: start over.
function keyPressed() {
  //*simple* space pauses and plays, in both modes (it replaced the Pause button).
  if (key === " ") {
    togglePause();
    return false; //stops the page from scrolling down too.
  }
  //*game* in game mode the teaching keys do nothing.
  //*levels* Enter moves on when a level is done, and 1, 2, 3 jump straight to a level.
  //*fix* in Fix mode the teaching keys work in the game too (Enter and Backspace below), and the game keys don't.
  if (gameOn && !fixing) {
    if (key === "Enter" && gameState === "levelDone") {
      nextLevel();
    }
    if (key >= "1" && key <= String(mainLevels)) { //*endless* only the 3 written levels have keys
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
  //*notes* S saves the translation record. (in Fix mode, S is for teaching the letter S instead.)
  if ((key === "s" || key === "S") && !fixing) {
    saveRecord();
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
      videoToCanvasX(point.x, fit), //*mirror*
      point.y * fit.scale + fit.offsetY,
      10,
    );
  }
  pop();
}

//*change* the box in the top-left corner: instructions and example counts.
//*simple* one short card now (it used to be 2 long panels and a big guess card in the top-right corner).
//what it reads floats above your hand instead, and what you've signed is in the right-hand column.
function drawSignPanel() {
  if (!showHelp || showChart || fixing) {
    return; //*chart* the chart goes here when it's open, and *fix* the Fix panel goes here while it's on.
  }
  let lines = [];
  lines.push("sign a letter: it shows above your hand, and hold it to write it down.");
  lines.push("hand down = space · S = save · space bar = pause");
  lines.push("read wrong? press Fix to teach it your hand.");
  //what's happening right now.
  if (!handPose) {
    lines.push("loading hand tracking...");
  } else if (modelState === "training") {
    lines.push("learning your compliments... round " + trainingRound + " of " + trainingRounds);
  } else if (!smoothHand) {
    lines.push("no hand found: hold your hand up");
  } else {
    lines.push(paused ? "paused" : "hand found");
  }
  if (warning) {
    lines.push(warning); //*fix*
  }

  let w = min(panelWidth, width - 32);
  let boxHeight = 106 + lines.length * 18 + (warning ? 18 : 0);
  push();
  noStroke();
  fill(...gamePaper, panelAlpha);
  softPanel(16, panelTop, w, boxHeight);
  fill(...gameInk);
  textAlign(LEFT, TOP);
  textSize(14);
  textStyle(BOLD);
  text("SIGN PRACTICE", 30, panelTop + 12);
  textStyle(NORMAL);
  textSize(11.5);
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], 30, panelTop + 34 + i * 18, w - 28);
  }

  //*simple* the compliments, as one row of emoji. the one it sees lights up; how many examples each has is below it.
  let rowTop = panelTop + boxHeight - 66;
  textStyle(BOLD);
  text(modelState === "ready" ? "compliments (Backspace = start over):" : "compliments: hold 1-4 while making one, then Enter", 30, rowTop);
  textStyle(NORMAL);
  let showing = currentCompliment();
  for (let i = 0; i < compliments.length; i++) {
    let compliment = compliments[i];
    let x = 30 + i * 84;
    if (showing === compliment) {
      fill(214, 232, 255);
      rect(x - 6, rowTop + 16, 76, 44, 10);
      fill(...gameInk);
    }
    textSize(22);
    text(compliment.emoji, x, rowTop + 20);
    textSize(11);
    let saved = sampleCounts[compliment.key] || 0;
    text("[" + compliment.key + "] " + (modelState === "collecting" ? saved : ""), x + 32, rowTop + 26);
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
  gameButton.html(gameOn ? "Game: on" : "Game: off");
  helpButton.style("display", gameOn ? "none" : ""); //*ui* the game always shows its panel, so help only matters in practice.
  readButton.style("display", gameOn ? "none" : ""); //*numbers* the game reads letters and signs only.
  placeButtons(); //*simple* close the gaps left by the hidden buttons.
  if (gameOn) {
    startGame();
  } else {
    demoBox.hide(); //*api*
    restoreBalls(); //*eat*
    //*ui* forget the game's sign, so practice mode starts its demo box fresh.
    demoWords = "";
    demoViewer.removeAttribute("src");
  }
  placeDemoBox(); //*ui* the box sits in a different spot in each mode.
  placeChartBox(); //*chart* so does the chart.
}

function startGame() {
  score = 0;
  levels.length = mainLevels; //*endless* forget the endless levels from last game, so new ones get made.
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
//*endless* after the last level, it makes a new one, so it never runs out.
function nextLevel() {
  if (!levelPassed()) {
    score -= levelScore; //trying again, so this level's points come back off.
    startLevel(levelIndex);
    return;
  }
  if (levelIndex + 1 >= levels.length) {
    levels.push(makeEndlessLevel(levels.length + 1));
  }
  startLevel(levelIndex + 1);
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
  demoBox.style("border-radius", "22px 12px 26px 10px"); //*ui* uneven corners, like the panels.
  demoBox.style("background", "rgba(240, 235, 255, 0.85)");
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
//*simple* both modes: in the right-hand column, under the Notes button (and, in practice, under what you signed).
function placeDemoBox() {
  if (!gameOn) {
    demoBox.position(max(16, width - 276), notesCardTop + notesCardHeight + 12);
  } else if (width >= 960) {
    demoBox.position(width - 276, notesCardTop);
  } else {
    demoBox.position(16, panelTop + gamePanelHeight() + 12);
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
  showSign(current.demo || current.sentence); //*ui* the loading part is in showSign(), so practice mode can use it too.
}

//*ui* asks the API for the real ASL sign for some words (or one letter), and plays it in the demo box.
//game mode uses it for each sentence; practice mode uses it for whatever sign it recognises.
async function showSign(words) {
  demoWords = words;
  demoCaption.html("loading the real sign...");

  try {
    if (!demoFiles[words]) {
      //spoken=en means the text is English, signed=ase means American Sign Language.
      let address = signApi + "?text=" + encodeURIComponent(words) + "&spoken=en&signed=ase";
      //*ui* the API refuses requests that say which website they came from (it answers 403 for github.io and
      //for local test servers), so this asks without saying ("no-referrer"). if it fails, this jumps to the catch below.
      let response = await fetch(address, { referrerPolicy: "no-referrer" });
      if (!response.ok) {
        throw new Error("sign API answered " + response.status);
      }
      //*ui* the viewer would download it again (and say where from), so it gets the file we already have instead.
      let file = await response.blob();
      demoFiles[words] = URL.createObjectURL(file); //remember it, so each sign is only downloaded once.
    }
    //if something else was asked for while this was downloading (a new sentence, or a new sign), don't show the old one.
    if (demoWords !== words) {
      return;
    }
    demoViewer.setAttribute("src", demoFiles[words]);
    demoCaption.html('The real ASL sign for "' + words + '", machine-translated by sign.mt. Watch how it moves, then copy the hand shape.');
  } catch (error) {
    console.log("sign demo error:", error);
    demoCaption.html("Couldn't load the real sign (is the internet on?). Everything else still works without it.");
  }
}

//*ui* practice mode with help on: shows the demo box, with the real sign for what it recognises right now.
//it only asks the API again when the recognised sign changes, not every frame.
function updatePracticeDemo() {
  if (!showHelp) {
    demoBox.hide();
    return;
  }
  demoBox.show();
  let sign = currentHandSign(); //*letters*
  if (sign) {
    if (sign.words !== demoWords) {
      showSign(sign.words);
    }
  } else if (demoWords === "") {
    demoCaption.html("Make an alphabet letter (A to Z) or a compliment you taught it: its real ASL sign will show up here.");
  }
}

//*ui* the sign it recognises, in a bubble just above your hand, so it follows your hand around.
//*notes* it shows with help on or off, so you always see what it reads.
function drawHandLabel() {
  let sign = currentHandSign(); //*letters*
  if (!sign || !smoothHand || !video || video.width === 0) {
    return;
  }
  let fit = videoFit();
  let middle = handMiddle();
  //the top of the hand is its highest point (the smallest y).
  let handTop = min(smoothHand.keypoints.map((point) => point.y)) * fit.scale + fit.offsetY;
  let isEmoji = sign.label !== sign.words; //a compliment shows its emoji; a letter shows the letter.
  let label = sign.label;
  let x = middle.x;
  let y = max(36, handTop - 40); //above the hand, but never off the top of the canvas.

  push();
  noStroke();
  fill(...gamePaper, panelAlpha);
  circle(x, y, 58);
  fill(...gameInk);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(isEmoji ? 30 : 32);
  text(label, x, y + 2);
  //*notes* a compliment also shows its sentence, in a little card under the bubble.
  if (isEmoji) {
    textSize(13);
    let w = textWidth(sign.words) + 20;
    fill(...gamePaper, panelAlpha);
    rect(x - w / 2, y + 34, w, 24, 12);
    fill(...gameInk);
    text(sign.words, x, y + 46);
  }
  pop();
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
  if (smoothHand && stepMatches(smoothHand, steps[stepIndex])) { //*endless* letters or hand shapes
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
  return max(176 + mostSteps * 52, 190 + mostSentences * 20);
}

//*ui* the game panel's width: the same narrow width as the practice panels, but never wider than the window.
function gamePanelWidth() {
  return min(panelWidth, width - 32);
}

//the game panel, in the top-left corner under the buttons.
//*ui* narrower and see-through now, with the same soft wobbly corners as the practice panels.
function drawGamePanel() {
  let left = 16;
  let top = panelTop;
  let panelWidth = gamePanelWidth();
  let panelHeight = gamePanelHeight();
  let level = levels[levelIndex];

  push();
  noStroke();
  textAlign(LEFT, TOP);
  fill(...gamePaper, panelAlpha);
  softPanel(left, top, panelWidth, panelHeight);

  if (gameState === "levelDone") {
    drawLevelDone(left, top, panelWidth, panelHeight);
    pop();
    return;
  }

  let current = level.sentences[sentenceIndex];

  //top row: which level and sentence, and the score. *ui* the level's name is left out, so it fits the narrower panel.
  fill(...gameInk);
  textSize(13);
  textStyle(BOLD);
  text(
    levelTitle() + "  ·  " + (sentenceIndex + 1) + " of " + level.sentences.length, //*endless*
    left + 14,
    top + 12,
  );
  textAlign(RIGHT, TOP);
  text("score: " + score, left + panelWidth - 14, top + 12);

  //the sentence, big, with the seconds left beside it.
  textSize(22);
  text(ceil(timeLeft) + " s", left + panelWidth - 14, top + 42);
  textAlign(LEFT, TOP);
  //*ui* starts at 30 and shrinks until the sentence fits beside the seconds.
  let sentenceSize = 30;
  textSize(sentenceSize);
  while (textWidth(current.sentence) > panelWidth - 90 && sentenceSize > 11) { //*endless* mixes can be long, so it goes down to 11
    sentenceSize -= 1;
    textSize(sentenceSize);
  }
  text(current.sentence, left + 14, top + 38);
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
  let rowHeight = 52; //*ui* taller rows, so the "how" text has room to wrap onto 2 lines.
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
    textSize(11);
    text(showHow ? step.how : "from memory: which hand shape was it?", left + 60, rowTop + 17, panelWidth - 74);
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
  //*ui* the message and the note wrap onto 2 lines each, to fit the narrower panel.
  let messageTop = top + panelHeight - 70;
  fill(...gameInk);
  textSize(13);
  textStyle(BOLD);
  text(message, left + 14, messageTop, panelWidth - 28);
  textStyle(NORMAL);
  textSize(11);
  text(
    "Simplified one-hand shapes. Real ASL also uses movement, both hands and your face.",
    left + 14,
    messageTop + 36,
    panelWidth - 28,
  );
  pop();
}

//*levels* the screen at the end of a level: the score, which sentences you finished in time, and what Enter does next.
function drawLevelDone(left, top, panelWidth, panelHeight) {
  let level = levels[levelIndex];
  let learned = sentenceResults.filter((result) => result).length;
  fill(...gameInk);
  textSize(14);
  textStyle(BOLD);
  text(levelTitle() + "  ·  done!", left + 14, top + 12); //*ui* no level name, so it fits. *endless*
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
  } else if (levelIndex + 1 >= mainLevels) {
    //*endless* from level 3 on, the next level is a new endless one.
    //*endless* says which theme of words comes next.
    let nextTheme = themes[(levelIndex + 1 - mainLevels) % themes.length].name;
    next = "Level passed! Press Enter for level " + (levelIndex + 2) + ": words about " + nextTheme + ".";
  } else {
    next = "Level passed! Press Enter for level " + (levelIndex + 2) + ".";
  }
  textStyle(BOLD);
  text(next, left + 14, top + panelHeight - 48, panelWidth - 28); //*ui* wraps onto 2 lines in the narrower panel.
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

    //*smile* its colours as plain numbers, and the brighter colours it turns into when you smile.
    //worked out once here, not every frame.
    this.originalRGB = toRGB(this.originalColor);
    this.highlightRGB = toRGB(this.highlightColor);
    this.brightOriginal = brighter(this.originalColor);
    this.brightHighlight = brighter(this.highlightColor);
    this.rgb = this.originalRGB; //whichever colour it has right now...
    this.brightRGB = this.brightOriginal; //...and the bright version of it.

    //*smile* each ball is a little flower bud that opens when you smile.
    this.bloom = 0; //0 = a closed bud (it looks like a ball), 1 = wide open.
    this.bloomSpeed = random(0.04, 0.15); //each one opens at its own speed, so they ripple open instead of all at once.
    this.turn = random(TWO_PI); //each one is turned a different way, so they don't all look the same.

    //*tears* each ball can also become a teardrop that slides down and starts again, like rain.
    this.tear = 0; //0 = a ball (or flower), 1 = a full teardrop.
    this.dripSpeed = random(0.6, 1.6); //how fast its drop falls, in pixels a frame.
    this.dripStart = random(dripLength); //where in its fall it starts, so they don't all fall together.

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
    let maskX = floor(canvasToVideoX(this.x, { scale: scale, offsetX: offsetX })); //*mirror*
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
    //*tears* turns into a teardrop when you look unhappy (and more unhappy than happy), and back when you don't.
    let crying = sadness > sadThreshold && sadness > smile;
    this.tear = lerp(this.tear, crying ? sadness : 0, this.bloomSpeed);

    if (this.clicked || this.bodyAmount > 0.5) {
      this.highlight();
    } else {
      this.dehighlight();
    }
  }

  highlight() {
    this.color = this.highlightColor;
    this.rgb = this.highlightRGB; //*smile*
    this.brightRGB = this.brightHighlight;
  }

  dehighlight() {
    this.color = this.originalColor;
    this.rgb = this.originalRGB; //*smile*
    this.brightRGB = this.brightOriginal;
  }

  //*tears* a teardrop: round at the bottom and pointed at the top. it slides down from its spot, fading out,
  //then starts again, so all of them together look like rain. the more unhappy you look, the bigger and bluer.
  showTear(r) {
    let ctx = drawingContext; //the canvas's own drawing commands, for speed (see the flowers below).
    //how far down it has slid: counts up with the pulse clock (so pausing freezes the rain), and starts again at dripLength.
    let fall = ((pulseTime * this.dripSpeed + this.dripStart) % dripLength) * this.tear;
    let x = this.x;
    let y = this.y + fall;
    let s = r * (0.8 + 0.9 * this.tear); //the round part's radius.

    let dropRed = lerp(this.rgb[0], rainBlue[0], this.tear);
    let dropGreen = lerp(this.rgb[1], rainBlue[1], this.tear);
    let dropBlue = lerp(this.rgb[2], rainBlue[2], this.tear);
    let fade = 1 - fall / (dripLength + 1); //fades out as it falls.
    let alpha = (this.bodyAmount > 0.5 ? 0.45 : 1) * fade; //see-through on you, like the flowers.
    ctx.fillStyle = "rgba(" + dropRed + "," + dropGreen + "," + dropBlue + "," + alpha + ")";

    ctx.beginPath();
    ctx.moveTo(x, y - s * 2.2); //the point at the top.
    ctx.bezierCurveTo(x + s * 0.2, y - s * 1.2, x + s, y - s * 0.6, x + s, y); //down the right side.
    ctx.arc(x, y, s, 0, PI); //round the bottom.
    ctx.bezierCurveTo(x - s, y - s * 0.6, x - s * 0.2, y - s * 1.2, x, y - s * 2.2); //back up the left side.
    ctx.fill();
  }

  //*smile* a closed bud is just a ball. as it blooms, its petals spread out from the middle,
  //get brighter, and a yellow centre shows.
  show() {
    let r = this.size();
    noStroke();

    //*tears* unhappy: a teardrop instead of a flower.
    if (this.tear > 0.02 && this.tear > this.bloom) {
      this.showTear(r);
      return;
    }

    //closed: one circle. (this also saves time, since drawing petals for thousands of balls is slow.)
    if (this.bloom < 0.02) {
      fill(this.color);
      circle(this.x, this.y, r * 2);
      return;
    }

    //open: thousands of flowers with 6 shapes each is too slow with p5's fill() and circle() (it dropped to a few
    //frames a second), so this uses the canvas's own drawing commands (drawingContext) instead.
    let ctx = drawingContext;

    //the petals: 5 circles that start on top of each other (a ball) and move outwards as it opens.
    //they're all added to one path and filled together, which is much faster than filling each one.
    let petalRed = lerp(this.rgb[0], this.brightRGB[0], this.bloom);
    let petalGreen = lerp(this.rgb[1], this.brightRGB[1], this.bloom);
    let petalBlue = lerp(this.rgb[2], this.brightRGB[2], this.bloom);
    //flowers on you are see-through, so they don't cover your face and body.
    let petalAlpha = this.bodyAmount > 0.5 ? 0.45 : 1;
    ctx.fillStyle = "rgba(" + petalRed + "," + petalGreen + "," + petalBlue + "," + petalAlpha + ")";
    let spread = r * 0.9 * flowerSize * this.bloom; //how far each petal has moved out from the middle.
    let petalRadius = r * (0.55 + 0.3 * this.bloom) * flowerSize; //the petals grow a little as they open.
    ctx.beginPath();
    for (let i = 0; i < flowerPetals; i++) {
      let angle = this.turn + (TWO_PI * i) / flowerPetals;
      let petalX = this.x + cos(angle) * spread;
      let petalY = this.y + sin(angle) * spread;
      ctx.moveTo(petalX + petalRadius, petalY); //start each circle on its own edge, so no lines join them.
      ctx.arc(petalX, petalY, petalRadius, 0, TWO_PI);
    }
    ctx.fill();

    //the yellow middle, growing in as it opens.
    ctx.fillStyle = "rgb(255,220,120)";
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.5 * flowerSize * this.bloom, 0, TWO_PI);
    ctx.fill();
  }
}
