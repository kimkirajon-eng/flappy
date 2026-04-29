const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let lastState = null;
let myRole = "";

// Ekran boyutunu ayarla
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.onresize = resize;
resize();

// --- KARAKTER SEÇME FONKSİYONLARI ---
// Bu fonksiyonlar global olmalı ki index.html'den erişilebilsin
window.pickRole = function(r) {
    myRole = r;
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step2').classList.add('active');
    document.getElementById('role-title').innerText = "Hoş geldin " + r;
    
    // Sadece Ceylan ölüm sınırını belirleyebilir
    document.getElementById('c-extras').style.display = (r === 'Ceylan' ? 'block' : 'none');
    // Sadece Hakkı Aşk Modu kutusunu görebilir
    document.getElementById('h-extras').style.display = (r === 'Hakkı' ? 'block' : 'none');
};

window.finishSetup = function() {
    const bet = document.getElementById('betInput').value;
    const limit = document.getElementById('limitInput').value;
    const askCheck = document.getElementById('askCheck') ? document.getElementById('askCheck').checked : true;
    const heartColor = document.getElementById('hColor').value;

    if(!bet) {
        alert("Lütfen neyine oynadığınızı yazın! ❤️");
        return;
    }

    socket.emit('join', {
        role: myRole,
        bet: bet,
        limit: limit,
        askModu: askCheck,
        heartColor: heartColor
    });
    
    document.getElementById('overlay').style.display = 'none';
};

// --- OYUN DÖNGÜSÜ ---
socket.on('gameState', (data) => {
    lastState = data;
});

function draw() {
    if (!lastState) {
        requestAnimationFrame(draw);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const worldH = canvas.height / 2;
    const scale = worldH / 300;

    [0, worldH].forEach((offsetY, idx) => {
        const roleName = idx === 0 ? "Ceylan" : "Hakkı";
        ctx.save();
        ctx.translate(0, offsetY);

        // Arka Plan (Gün Döngüsü)
        const d = Math.abs(Math.sin(lastState.frameCount * 0.003)) * 80;
        ctx.fillStyle = `rgb(${255-d}, ${192-d/2}, ${203-d/2})`;
        ctx.fillRect(0, 0, canvas.width, worldH);

        // Borular (Yeşil Flappy Boruları)
        ctx.fillStyle = '#2ecc71';
        lastState.pipes.forEach(pipe => {
            ctx.fillRect(pipe.x, 0, 50, pipe.top * scale);
            ctx.fillRect(pipe.x, pipe.bottom * scale, 50, worldH);
        });

        // Oyuncular (Kalpler)
        for (let id in lastState.players) {
            let p = lastState.players[id];
            if (p.role === roleName) {
                drawHeart(ctx, 100, p.y * scale, 35 * scale, p.heartColor);
                ctx.fillStyle = "white"; 
                ctx.font = "bold 18px Arial";
                ctx.fillText(`${p.role} Ölüm: ${p.deaths}`, 20, 30);
            }
        }
        ctx.restore();
    });

    // Orta ayırıcı
    ctx.fillStyle = "white"; 
    ctx.fillRect(0, worldH - 2, canvas.width, 4);

    requestAnimationFrame(draw);
}

function drawHeart(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + size/4);
    ctx.quadraticCurveTo(x, y, x + size/4, y);
    ctx.quadraticCurveTo(x + size/2, y, x + size/2, y + size/4);
    ctx.quadraticCurveTo(x + size/2, y, x + size*3/4, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + size/4);
    ctx.quadraticCurveTo(x + size, y + size/2, x + size/2, y + size*3/4);
    ctx.quadraticCurveTo(x, y + size/2, x, y + size/4);
    ctx.fill();
}

requestAnimationFrame(draw);

// --- DİĞER KOMUTLAR ---
socket.on('gameOver', t => {
    document.getElementById('win-screen').style.display = 'flex';
    document.getElementById('win-text').innerHTML = t;
});

socket.on('resetClient', () => location.reload());

window.addEventListener('touchstart', (e) => {
    if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
        socket.emit('jump');
    }
});

window.addEventListener('keydown', (e) => {
    if(e.code === 'Space') socket.emit('jump');
});
