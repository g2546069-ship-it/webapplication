let currentWeatherCode = 0;
let currentTemp = 0;
let characterState = "normal";
let rawApiData = null;

// 画像アセットオブジェクト
const images = {
  // 新しい背景画像
  backSunny: null, backRainy: null, backCloudy: null,
  // 天気アイコン
  sunny: null, rainy: null, cloudy: null,
  // キャラクター体
  bodySuccess: null, bodyFail: null, bodyNormal: null,
  // 表情
  faceSmile: null, faceCry: null, faceNiko: null,
  // 持ち物
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
    if (commentText) commentText.textContent = "雨なのに傘がないよ！びしょ濡れになっちゃう…😭";
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
// p5.js 画像読み込み ＆ レイヤー合成処理
// ==========================================
function preload() {
  // .png と .jpg のどちらの拡張子でも読み込めるヘルパー関数
  const loadWithFallback = (basePath, key) => {
    loadImage(
      basePath + '.png',
      img => { images[key] = img; },
      () => {
        loadImage(
          basePath + '.jpg',
          img => { images[key] = img; },
          () => { images[key] = null; }
        );
      }
    );
  };

  // 1. 新しい背景画像
  loadWithFallback('media/back sunny', 'backSunny');
  loadWithFallback('media/back rainy', 'backRainy');
  loadWithFallback('media/back cloudy', 'backCloudy');

  // 2. 天気アイコン
  loadWithFallback('media/sunny', 'sunny');
  loadWithFallback('media/rainy', 'rainy');
  loadWithFallback('media/cloudy', 'cloudy');

  // 3. キャラの体パーツ
  loadWithFallback('media/success', 'bodySuccess');
  loadWithFallback('media/fail', 'bodyFail');
  loadWithFallback('media/nomal', 'bodyNormal');

  // 4. 顔パーツ
  loadWithFallback('media/smile', 'faceSmile');
  loadWithFallback('media/cry', 'faceCry');
  loadWithFallback('media/niko', 'faceNiko');

  // 5. 持ち物パーツ
  loadWithFallback('media/raincoat', 'raincoat');
  loadWithFallback('media/umbrella', 'umbrella');
  loadWithFallback('media/sunscreen', 'sunscreen');
}

function setup() {
  const container = document.getElementById('canvas-container');
  const canvasWidth = container ? container.clientWidth : 360;
  const canvasHeight = container ? container.clientHeight : 360;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('canvas-container');
  imageMode(CENTER);
}

function draw() {
  clear();

  // レイヤー1: 天気に応じた背景イラスト（最背面）
  drawSceneBackground();

  // レイヤー2: 天気アイコン（太陽・雲・雨を大きくして枠から少しはみ出させる）
  drawWeatherIcon();

  // レイヤー3〜5: キャラクター（体・表情・持ち物を同じ座標・同じサイズで重ねる）
  drawCharacterAndItems();

  // レイヤー6: リアルタイム気温（右上に表示）
  if (currentTemp !== 0) {
    // 背景の上でも読みやすいように白い縁取りを追加
    stroke(255, 255, 255, 220);
    strokeWeight(6);
    fill(50, 60, 70);
    textSize(48);
    textAlign(CENTER, CENTER);
    textFont('sans-serif');
    text(Math.round(currentTemp) + "°", width * 0.78, 60);
    noStroke();
  }
}

// 背景イラストの描画（下部の草原が見切れないよう下端合わせで配置）
function drawSceneBackground() {
  const isSunny = currentWeatherCode === 0;
  const isRainy = (currentWeatherCode >= 51 && currentWeatherCode <= 67) || (currentWeatherCode >= 80 && currentWeatherCode <= 82);

  let bgImg = images.backCloudy;
  if (isSunny) bgImg = images.backSunny;
  else if (isRainy) bgImg = images.backRainy;

  if (bgImg) {
    // キャンバスの幅に合わせて比率を維持し、下端（草原側）を基準に配置
    const drawW = width;
    const drawH = width * (bgImg.height / bgImg.width);
    const drawY = height - (drawH / 2);
    image(bgImg, width / 2, drawY, drawW, drawH);
  } else {
    // 画像未配置時のデフォルト背景
    noStroke();
    fill(255, 255, 255, 200);
    rect(0, 0, width, height);
  }
}

// 天気アイコンの描画（大きくして枠から少しはみ出る配置）
function drawWeatherIcon() {
  const isSunny = currentWeatherCode === 0;
  const isRainy = (currentWeatherCode >= 51 && currentWeatherCode <= 67) || (currentWeatherCode >= 80 && currentWeatherCode <= 82);

  // 左上寄りに配置し、サイズを大きく（190px）して上端・左端から少しはみ出させる
  const iconX = 75;
  const iconY = 75;
  const iconSize = 190;

  if (isSunny && images.sunny) {
    image(images.sunny, iconX, iconY, iconSize, iconSize);
  } else if (isRainy && images.rainy) {
    image(images.rainy, iconX, iconY, iconSize, iconSize);
  } else if (!isSunny && !isRainy && images.cloudy) {
    image(images.cloudy, iconX, iconY, iconSize, iconSize);
  }
}

// キャラクター・表情・持ち物の描画（すべて同じ座標・同じサイズで重ねる）
function drawCharacterAndItems() {
  // 草原の上にキャラが立つ位置・サイズ
  const charX = width * 0.56;
  const charY = height * 0.60;
  const charSize = 270;

  const hasUmbrella = document.querySelector('input[value="umbrella"]')?.checked;
  const hasRaincoat = document.querySelector('input[value="raincoat"]')?.checked;
  const hasSunscreen = document.querySelector('input[value="sunscreen"]')?.checked;

  // 1. 体の描画
  let bodyImg = images.bodyNormal;
  if (characterState === "happy") bodyImg = images.bodySuccess;
  else if (characterState === "sad" || characterState === "worried") bodyImg = images.bodyFail;

  if (bodyImg) {
    image(bodyImg, charX, charY, charSize, charSize);
  }

  // 2. 表情の描画（体とまったく同じ座標・サイズで重ねる）
  let faceImg = images.faceNiko;
  if (characterState === "happy") faceImg = images.faceSmile;
  else if (characterState === "sad" || characterState === "worried") faceImg = images.faceCry;

  if (faceImg) {
    image(faceImg, charX, charY, charSize, charSize);
  }

  // 3. 持ち物の描画（チェックが入っているものを同じ座標・サイズで重ねる）
  if (hasRaincoat && images.raincoat) {
    image(images.raincoat, charX, charY, charSize, charSize);
  }
  if (hasUmbrella && images.umbrella) {
    image(images.umbrella, charX, charY, charSize, charSize);
  }
  if (hasSunscreen && images.sunscreen) {
    image(images.sunscreen, charX, charY, charSize, charSize);
  }
}