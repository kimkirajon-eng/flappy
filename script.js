const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let myRole = "";

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.onresize = resize; resize();

function pickRole(r) {
    myRole = r;
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step2').classList.add('active');
    document.getElementById('role-title').innerText = "Hoş geldin " + r;
    document.getElementById(r === 'Ceylan' ? 'c-extras' : 'h-extras').style.display = 'block';
}

function finishSetup() {
    socket.emit('join', {
        role: myRole, bet: document.getElementById('betInput').value,
        limit: document.getElementById('limitInput').value,
        askModu: document.getElementById('askCheck').checked,
        heartColor: document.getElementById('hColor').value
    });
    document.getElementById('overlay').style.display = 'none';
}

socket.on('gameState', (data) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const worldH = canvas.height / 2;
    const scale = worldH / 300;

    // --- HER İKİ EKRANI DA ÇİZ ---
    [0, worldH].forEach((offsetY, idx) => {
        const roleName = idx === 0 ? "Ceylan" : "Hakkı";
        ctx.save();
        ctx.translate(0, offsetY);

        // Arka Plan (Gün Döngüsü)
        const d = Math.abs(Math.sin(data.frameCount * 0.003)) * 80;
        ctx.fillStyle = `rgb(${255-d}, ${192-d/2}, ${203-d/2})`;
        ctx.fillRect(0, 0, canvas.width, worldH);

        // BORULARI ÇİZ (Senin gönderdiğin yeşil boru mantığı)
        data.pipes.forEach(pipe => {
            ctx.fillStyle = '#2ecc71';
            // Üst Boru
            ctx.fillRect(pipe.x, 0, 50, pipe.top * scale);
            // Alt Boru
            ctx.fillRect(pipe.x, pipe.bottom * scale, 50, worldH);
        });

        // OYUNCULARI ÇİZ (Senin gönderdiğin oyuncu mantığı + Kalp görseli)
        for (let id in data.players) {
            let p = data.players[id];
            if (p.role === roleName) {
                drawHeart(ctx, 100, p.y * scale, 35 * scale, p.heartColor);
                ctx.fillStyle = "white"; ctx.font = "bold 16px Arial";
                ctx.fillText(`${p.role}: ${p.deaths}`, 20, 30);
            }
        }
        ctx.restore();
    });

    // Orta ayırıcı
    ctx.fillStyle = "white"; ctx.fillRect(0, worldH-2, canvas.width, 4);
});

function drawHeart(ctx, x, y, size, color) {
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(x, y + size/4); ctx.quadraticCurveTo(x, y, x + size/4, y);
    ctx.quadraticCurveTo(x + size/2, y, x + size/2, y + size/4);
    ctx.quadraticCurveTo(x + size/2, y, x + size*3/4, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + size/4);
    ctx.quadraticCurveTo(x + size, y + size/2, x + size/2, y + size*3/4);
    ctx.quadraticCurveTo(x, y + size/2, x, y + size/4); ctx.fill();
}

socket.on('gameOver', t => { document.getElementById('win-screen').style.display='flex'; document.getElementById('win-text').innerHTML=t; });
socket.on('resetClient', () => location.reload());
window.addEventListener('touchstart', (e) => { if(e.target.tagName !== 'BUTTON') socket.emit('jump'); });
window.addEventListener('keydown', e => { if(e.code === 'Space') socket.emit('jump'); });
