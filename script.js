let currentWeatherCode = 0;
let currentTemp = 0;
let characterState = "normal";
let rawApiData = null;

// 画像アセットオブジェクト
const images = {
  sunny: null, rainy: null, cloudy: null,
  bodySuccess: null, bodyFail: null, bodyNormal: null,
  faceSmile: null, faceCry: null, faceNiko: null,
  raincoat: null, umbrella: null, sunscreen: null
};

document.addEventListener("DOMContentLoaded", function () {
  updateDate();
  fetchWeatherData();

  const bottomSheet = document.getElementById('bottomSheet');
  const sheetHandle = document.getElementById('sheetHandle');
  if (sheetHandle && bottomSheet) {
    sheetHandle.addEventListener('click', () => {
      bottomSheet.classList.toggle('open');
    });
  }
});

function fetchWeatherData() {
  const latitude = 35.6895;
  const longitude = 139.6917;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&hourly=weather_code,temperature_2m&timezone=Asia%2FTokyo`;

  fetch(weatherUrl)
    .then(response => response.json())
    .then(data => {
      rawApiData = data;
      applyWeatherData(data.current.weather_code, data.current.temperature_2m);
      showHourlyTimeline(data.hourly);
      setupItemCheckListeners();
    })
    .catch(error => {
      console.error("天気データの取得に失敗しました:", error);
      applyWeatherData(0, 22);
      showHourlyTimelineFallback();
      setupItemCheckListeners();
    });
}

function applyWeatherData(code, temp) {
  currentWeatherCode = code;
  currentTemp = temp;
  showWeather(currentWeatherCode, currentTemp);
  evaluateItems();
}

function updateDate() {
  const dateElement = document.querySelector('.date');
  if (dateElement) {
    const today = new Date();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const dayList = ["日", "月", "火", "水", "木", "金", "土"];
    const day = dayList[today.getDay()];
    dateElement.textContent = `${month}月${date}日(${day})`;
  }
}

function showHourlyTimeline(hourlyData) {
  const timelineContainer = document.querySelector('.timeline');
  if (!timelineContainer) return;
  timelineContainer.innerHTML = '';
  const targetHours = [6, 12, 18, 24];

  targetHours.forEach(function(hour) {
    const index = (hour === 24) ? 23 : hour;
    const weatherCode = hourlyData.weather_code[index];
    const icon = getWeatherIcon(weatherCode);

    const timeSlot = document.createElement('div');
    timeSlot.className = 'time-slot';
    timeSlot.innerHTML = `<span>${hour}時</span>${icon}<span>${Math.round(hourlyData.temperature_2m[index])}℃</span>`;
    timelineContainer.appendChild(timeSlot);
  });
}

function showHourlyTimelineFallback() {
  const timelineContainer = document.querySelector('.timeline');
  if (!timelineContainer) return;
  timelineContainer.innerHTML = `
    <div class="time-slot"><span>6時</span>☀️<span>16℃</span></div>
    <div class="time-slot"><span>12時</span>☀️<span>23℃</span></div>
    <div class="time-slot"><span>18時</span>⛅<span>20℃</span></div>
    <div class="time-slot"><span>24時</span>🌧️<span>15℃</span></div>
  `;
}

function showWeather(weatherCode, temp) {
  const weatherIcon = document.getElementById("weather-icon");
  const tempElement = document.getElementById("temperature");

  if (tempElement) tempElement.textContent = Math.round(temp) + "℃";
  if (weatherIcon) {
    weatherIcon.textContent = getWeatherIcon(weatherCode);
    if (weatherCode === 0) document.body.className = "weather-sunny";
    else if (weatherCode >= 1 && weatherCode <= 3) document.body.className = "weather-cloudy";
    else if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) document.body.className = "weather-rainy";
    else document.body.className = "weather-cloudy";
  }
}

function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if (code >= 1 && code <= 3) return "⛅";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "🌧️";
  if (code >= 71 && code <= 77) return "☃️";
  return "⛅";
}

function setupItemCheckListeners() {
  const checkboxes = document.querySelectorAll('.item-list input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.removeEventListener('change', evaluateItems);
    checkbox.addEventListener('change', evaluateItems);
  });
  evaluateItems();
}

function evaluateItems() {
  const commentText = document.getElementById('comment-text');
  const hasUmbrella = document.querySelector('input[value="umbrella"]')?.checked || document.querySelector('input[value="raincoat"]')?.checked;
  const hasSunscreen = document.querySelector('input[value="sunscreen"]')?.checked;

  const isRainy = (currentWeatherCode >= 51 && currentWeatherCode <= 67) || (currentWeatherCode >= 80 && currentWeatherCode <= 82);
  const isSunnyAndHot = (currentWeatherCode === 0 && currentTemp >= 25);

  if (isRainy && !hasUmbrella) {
    characterState = "sad";
    if (commentText) commentText.textContent = "あわわ！雨なのに傘がないよ！びしょ濡れになっちゃう…😭";
  } else if (isSunnyAndHot && !hasSunscreen) {
    characterState = "worried";
    if (commentText) commentText.textContent = "日差しが強くて暑いよ！日焼け止めを忘れずに塗ろう！☀️";
  } else if ((isRainy && hasUmbrella) || (isSunnyAndHot && hasSunscreen)) {
    characterState = "happy";
    if (commentText) commentText.textContent = "準備ばっちり！今日もしっかり楽しんでいこう！✨";
  } else {
    characterState = "normal";
    if (commentText) commentText.textContent = "忘れ物はないかな？チェックしてみよう！";
  }
}

// テスト用デモ切替関数
function setDemoWeather(code, temp) {
  applyWeatherData(code, temp);
}

function resetWeather() {
  if (rawApiData) {
    applyWeatherData(rawApiData.current.weather_code, rawApiData.current.temperature_2m);
  } else {
    fetchWeatherData();
  }
}

// ==========================================
// p5.js 画像合成 ＆ ベクター描画フォールバック
// ==========================================
function preload() {
  const loadSafely = (path, key) => {
    loadImage(path, img => { images[key] = img; }, () => { images[key] = null; });
  };

  loadSafely('media/sunny.png', 'sunny');
  loadSafely('media/rainy.jpg', 'rainy');
  loadSafely('media/cloudy.png', 'cloudy');

  loadSafely('media/success.png', 'bodySuccess');
  loadSafely('media/fail.png', 'bodyFail');
  loadSafely('media/nomal.png', 'bodyNormal');

  loadSafely('media/smile.png', 'faceSmile');
  loadSafely('media/cry.png', 'faceCry');
  loadSafely('media/niko.png', 'faceNiko');

  loadSafely('media/raincoat.png', 'raincoat');
  loadSafely('media/umbrella.png', 'umbrella');
  loadSafely('media/sunscreen.png', 'sunscreen');
}

function setup() {
  const container = document.getElementById('canvas-container');
  const canvasWidth = container ? container.clientWidth : 360;
  const canvas = createCanvas(canvasWidth, 300);
  canvas.parent('canvas-container');
  imageMode(CENTER);
}

function draw() {
  clear();

  noStroke();
  fill(255, 255, 255, 180);
  rect(0, 0, width, height, 16);

  // 1. 天気背景
  drawWeatherBackground();

  // 2. キャラクター＆持ち物
  drawCharacterAndItems();

  // 3. リアルタイム気温
  if (currentTemp !== 0) {
    fill(50, 60, 70);
    noStroke();
    textSize(48);
    textAlign(CENTER, CENTER);
    textFont('sans-serif');
    text(Math.round(currentTemp) + "°", width * 0.75, 70);
  }
}

function drawWeatherBackground() {
  const isSunny = currentWeatherCode === 0;
  const isRainy = (currentWeatherCode >= 51 && currentWeatherCode <= 67) || (currentWeatherCode >= 80 && currentWeatherCode <= 82);

  if (isSunny && images.sunny) {
    image(images.sunny, 90, 80, 110, 110);
  } else if (isRainy && images.rainy) {
    image(images.rainy, 90, 80, 110, 110);
  } else if (!isSunny && !isRainy && images.cloudy) {
    image(images.cloudy, 90, 80, 110, 110);
  } else {
    // 画像未配置時のベクター描画フォールバック
    push();
    translate(80, 80);
    if (isSunny) {
      fill(255, 180, 50); circle(0, 0, 70);
      stroke(255, 180, 50); strokeWeight(4);
      for (let a = 0; a < 360; a += 45) {
        line(cos(radians(a)) * 45, sin(radians(a)) * 45, cos(radians(a)) * 55, sin(radians(a)) * 55);
      }
    } else if (isRainy) {
      fill(120, 140, 160); noStroke();
      ellipse(0, 0, 70, 50); ellipse(-20, 10, 50, 40);
      fill(100, 160, 240);
      let t = millis() * 0.005;
      for (let i = -30; i <= 30; i += 20) {
        let y = ((t * 40 + i * 10) % 40) - 10;
        ellipse(i, 25 + y, 6, 12);
      }
    } else {
      fill(180, 200, 220); noStroke();
      ellipse(0, 0, 80, 50); ellipse(-25, 10, 60, 40); ellipse(25, 10, 50, 35);
    }
    pop();
  }
}

function drawCharacterAndItems() {
  const charX = width * 0.70;
  const charY = height * 0.65;

  const hasUmbrella = document.querySelector('input[value="umbrella"]')?.checked;
  const hasRaincoat = document.querySelector('input[value="raincoat"]')?.checked;
  const hasSunscreen = document.querySelector('input[value="sunscreen"]')?.checked;

  if (characterState === "happy") {
    if (images.bodySuccess && images.faceSmile) {
      image(images.bodySuccess, charX, charY, 130, 200);
      image(images.faceSmile, charX - 2, charY - 60, 65, 50);
      if (hasRaincoat && images.raincoat) image(images.raincoat, charX, charY + 10, 120, 120);
      if (hasUmbrella && images.umbrella) image(images.umbrella, charX + 25, charY - 10, 100, 100);
      if (hasSunscreen && images.sunscreen) image(images.sunscreen, charX - 45, charY + 20, 45, 60);
    } else {
      drawFallbackCharacter(charX, charY, "happy", { hasUmbrella, hasRaincoat, hasSunscreen });
    }
  } else if (characterState === "sad" || characterState === "worried") {
    if (images.bodyFail && images.faceCry) {
      image(images.bodyFail, charX, charY + 15, 120, 170);
      image(images.faceCry, charX - 5, charY - 35, 60, 45);
    } else {
      drawFallbackCharacter(charX, charY, characterState, { hasUmbrella, hasRaincoat, hasSunscreen });
    }
  } else {
    if (images.bodyNormal && images.faceNiko) {
      image(images.bodyNormal, charX, charY, 120, 190);
      image(images.faceNiko, charX, charY - 60, 60, 45);
    } else {
      drawFallbackCharacter(charX, charY, "normal", { hasUmbrella, hasRaincoat, hasSunscreen });
    }
  }
}

function drawFallbackCharacter(x, y, state, items) {
  push();
  translate(x, y);

  fill(items.hasRaincoat ? '#3182ce' : '#4a5568');
  noStroke();
  rect(-35, -40, 70, 90, 16);

  stroke(items.hasRaincoat ? '#3182ce' : '#4a5568');
  strokeWeight(12);
  if (state === "happy") {
    line(-30, -20, -55, -60); line(30, -20, 55, -60);
  } else {
    line(-30, -20, -45, 20); line(30, -20, 45, 20);
  }

  fill(255, 220, 180); noStroke();
  circle(0, -65, 65);

  fill(50);
  if (state === "happy") {
    arc(-12, -70, 12, 12, PI, TWO_PI); arc(12, -70, 12, 12, PI, TWO_PI);
    fill(230, 100, 100); arc(0, -60, 20, 16, 0, PI);
  } else if (state === "sad" || state === "worried") {
    ellipse(-12, -70, 8, 8); ellipse(12, -70, 8, 8);
    noFill(); stroke(50); strokeWeight(3); arc(0, -50, 16, 12, PI, TWO_PI);
    fill(100, 180, 255); noStroke(); ellipse(18, -65, 6, 10);
  } else {
    ellipse(-12, -70, 8, 8); ellipse(12, -70, 8, 8);
    fill(50); arc(0, -60, 16, 10, 0, PI);
  }

  if (items.hasUmbrella) {
    fill(235, 87, 87); noStroke(); arc(50, -60, 60, 50, PI, TWO_PI);
    stroke(100); strokeWeight(4); line(50, -60, 50, -10);
  }

  if (items.hasSunscreen) {
    fill(246, 173, 85); noStroke(); rect(-60, 0, 20, 30, 4);
    fill(237, 137, 54); rect(-58, -6, 16, 8, 2);
  }

  pop();
}