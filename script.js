let numbers = [];
let currentIndex = 0;
let answer = 0;
let isRunning = false;

const digitsSelect = document.getElementById("digits");
const countSelect = document.getElementById("count");
const speedSelect = document.getElementById("speed");
const modeSelect = document.getElementById("mode");

const currentEl = document.getElementById("current");
const answerInput = document.getElementById("answer-input");
const resultEl = document.getElementById("result");
const nextButton = document.getElementById("next-button");
const startButton = document.getElementById("start-button");

startButton.addEventListener("click", start);
document.getElementById("stop-button").addEventListener("click", stop);
nextButton.addEventListener("click", checkAnswer);
answerInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    checkAnswer();
  }
});

document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    stop();
  }
});

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateNumbers(digits, count, mode) {
  const nums = [];
  let sum = 0;

  const digitOptions = digits === "mixed34" ? [3, 4] : [parseInt(digits)];

  for (let i = 0; i < count; i++) {
    const selectedDigits = digitOptions[Math.floor(Math.random() * digitOptions.length)];
    const min = Math.pow(10, selectedDigits - 1);
    const max = Math.pow(10, selectedDigits) - 1;

    let num;

    if (mode === "add") {
      num = getRandomInt(min, max);
      sum += num;
    } else if (mode === "mix") {
      const canSubtract = sum >= min;

      if (!canSubtract || Math.random() < 0.5) {
        // 足し算
        num = getRandomInt(min, max);
        sum += num;
      } else {
        // 引き算（sum から引いてもマイナスにならない範囲に限定）
        const subMax = Math.min(max, sum); // sumまでしか引けない
        if (subMax >= min) {
          const subNum = getRandomInt(min, subMax);
          num = -subNum;
          sum += num;
        } else {
          // 足し算にフォールバック
          num = getRandomInt(min, max);
          sum += num;
        }
      }
    }
    nums.push(num);
  }
  return nums;
}


function start() {
  if (isRunning) return;
  isRunning = true;
  answerInput.value = "";
  resultEl.textContent = "";
  currentIndex = 0;

  document.getElementById("answer-container").style.display = "block";
  nextButton.style.display = "none";

  const digits = digitsSelect.value;
  const count = parseInt(countSelect.value);
  const speedSetting = speedSelect.value;
  const mode = modeSelect.value;

  numbers = generateNumbers(digits, count, mode);
  answer = numbers.reduce((sum, n) => sum + n, 0);

  setTimeout(() => {
    speakText("ねがいましては", () => {
      speakNextNumber(mode, speedSetting);
    });
  }, 1000);
}

function stop() {
  window.speechSynthesis.cancel();
  isRunning = false;
  currentEl.textContent = "停止しました";
  nextButton.style.display = "none";
  answerInput.blur();
}

function speakText(text, callback = null) {
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ja-JP";
  if (callback) {
    utter.onend = callback;
  }
  synth.speak(utter);
}

function speakNextNumber(mode, speedSetting) {
  if (!isRunning) return;

  if (currentIndex >= numbers.length) {
    currentEl.textContent = "答えを入力してください";
    nextButton.style.display = "inline";
    isRunning = false;
    answerInput.focus();
    speakText("では");
    return;
  }

  displayNumber(numbers[currentIndex], mode);

  speakNumber(numbers[currentIndex], mode, currentIndex, numbers.length, () => {
    currentIndex++;

    let delay = 700;
    switch (speedSetting) {
      case "slow": delay = 1200; break;
      case "normal": delay = 400; break;
      case "fast": delay = 50; break;
    }

    setTimeout(() => speakNextNumber(mode, speedSetting), delay);
  });
}

function speakNumber(num, mode, index = 0, total = 1, callback = null) {
  const synth = window.speechSynthesis;
  const isLast = index === total - 1;
  const isMinus = num < 0;
  const absValue = Math.abs(num);
  const prefix = isMinus ? "引いては " : "";
  const suffix = isLast ? "円" : "円なり";

  const utterNumber = new SpeechSynthesisUtterance(`${prefix}${absValue}`);
  utterNumber.lang = "ja-JP";

  const utterSuffix = new SpeechSynthesisUtterance(suffix);
  utterSuffix.lang = "ja-JP";

  utterNumber.onend = () => {
    synth.speak(utterSuffix);
    utterSuffix.onend = () => {
      if (callback) callback();
    };
  };

  synth.speak(utterNumber);
}

function displayNumber(num, mode) {
  const formatted = Math.abs(num).toLocaleString('ja-JP');
  if (mode === "mix") {
    currentEl.textContent = (num >= 0 ? "+" : "−") + formatted;
  } else {
    currentEl.textContent = formatted;
  }
}

function checkAnswer() {
  const rawInput = answerInput.value.replace(/,/g, ''); // カンマ除去
  const userAnswer = parseInt(rawInput);
  if (isNaN(userAnswer)) {
    resultEl.textContent = "答えを入力してください";
    resultEl.style.color = "black";
    return;
  }

  // 入力欄を桁区切りで更新
  answerInput.value = userAnswer.toLocaleString('ja-JP');

  if (userAnswer === answer) {
    resultEl.textContent = "正解です！";
    resultEl.style.color = "green";
    playSound("正解.mp3");
  } else {
    resultEl.textContent = `不正解。正解は ${answer.toLocaleString('ja-JP')} です。`;
    resultEl.style.color = "red";
    playSound("不正解.mp3");
  }

  nextButton.style.display = "none";
  startButton.focus();
}


function playSound(filename) {
  const audio = new Audio(filename);
  audio.volume = 0.3; // 音量を30%に設定（例：0.3）
  audio.play();
}

