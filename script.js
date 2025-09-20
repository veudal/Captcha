document.addEventListener('DOMContentLoaded', () => {

const canvas = document.getElementById('captchaCanvas');
const ctx = canvas.getContext('2d');
const captchaInput = document.getElementById('captchaInput');
const skipBtn = document.getElementById('skipBtn');
const loadingOverlay = document.getElementById('loading');

let stats = JSON.parse(localStorage.getItem('captchaStats')) || { total:0, correct:0, wrong:0, skipped:0, chars:0 };
let currentCaptcha = '';
let currentCaptchaImg = null;

function generateRandomText(length=5){
// Excluded: i, L, l, 0, O, o MAYBE also exlcude 5
  const chars = 'ABCDEFGHIJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789';
  let result = [];
  for (let i = 0; i < length; i++) {
    result.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  }
  return result.join(" ");
}

async function fetchCaptcha(text){
  loadingOverlay.classList.add('active');
  try {
    const response = await fetch('https://api.opencaptcha.io/captcha', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({text,
      "theme": {
        "primaryColor": "#FF6EC7",
        "secondaryColor": "#121212"
      }})
    });
    const blob = await response.blob();
    const img = new Image();
    const url = URL.createObjectURL(blob);
    await new Promise(resolve => { img.onload = resolve; img.src = url; });
    return img;
  } finally {
    loadingOverlay.classList.remove('active');
  }
}

async function drawCaptchaFromAPI(text){
  currentCaptchaImg = await fetchCaptcha(text);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(currentCaptchaImg, 0, 0, canvas.width, canvas.height);
}

function drawFeedbackOverlay(isCorrect){
  ctx.drawImage(currentCaptchaImg,0,0,canvas.width,canvas.height);
  ctx.fillStyle = isCorrect ? 'rgba(0,255,0,0.5)' : 'rgba(255,0,0,0.5)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = '100px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isCorrect ? '✔' : '✖', canvas.width/2, canvas.height/2);
  setTimeout(()=>{
    if(currentCaptchaImg) ctx.drawImage(currentCaptchaImg,0,0,canvas.width,canvas.height);
  }, 400);
}

async function loadNewCaptcha(){
  currentCaptcha = generateRandomText();
  await drawCaptchaFromAPI(currentCaptcha);
  currentCaptcha = currentCaptcha.replaceAll(" ", "");
  captchaInput.value='';
  updateStats();
  captchaInput.focus();
}

function updateStats(){
  document.getElementById('total').textContent = stats.total;
  document.getElementById('correct').textContent = stats.correct;
  document.getElementById('wrong').textContent = stats.wrong;
  document.getElementById('skipped').textContent = stats.skipped;
  document.getElementById('success').textContent = (stats.total===0?0:((stats.correct/stats.total*100).toFixed(1)))+'%';
  document.getElementById('chars').textContent = stats.chars;
  localStorage.setItem('captchaStats', JSON.stringify(stats));
}

let previousValue = '';

captchaInput.addEventListener('input', () => {
  const currentValue = captchaInput.value;

  // Only count if a new character was added
  if (currentValue.length > previousValue.length) {
    stats.chars++;
    updateStats();
  }

  previousValue = currentValue; // Update previous value
});


captchaInput.addEventListener('keyup',(e)=>{if(e.key==='Enter') checkCaptcha();});

async function checkCaptcha(){
  const userInput = captchaInput.value.trim();
  stats.total++;
  if(userInput===currentCaptcha){
    stats.correct++;
    drawFeedbackOverlay(true);
    updateStats();
    setTimeout(loadNewCaptcha,500);
  } else {
    stats.wrong++;
    drawFeedbackOverlay(false);
    updateStats();
  }
}

skipBtn.addEventListener('click',()=>{
  stats.skipped++;
  stats.total++;
  updateStats();
  loadNewCaptcha();
});

loadNewCaptcha();
});
