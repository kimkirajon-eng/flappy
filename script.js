const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let myRole = "";

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.onresize = resize;
resize();

// Karakter seçimi ve setup fonksiyonları index.html'deki butonlarla aynı isimde kalmalı
function pickRole(r) {
    myRole = r;
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step2').classList.add('active');
    document.getElementById('role-title').innerText = "Hoş geldin " + r;
    document.getElementById('h-extras').style.display = (r === 'Hakkı' ? 'block' : 'none');
    document.getElementById('c-extras').style.display = (r === 'Ceylan' ? 'block' : 'none');
}

function finishSetup() {
    socket.emit('join', {
        role: myRole,
        bet: document.getElementById('betInput').value,
        limit: document.getElementById('limitInput').value,
        askModu: document.getElementById('askCheck').checked,
        heartColor: document.getElementById('hColor').value
    });
    document.getElementById('overlay').style.display = 'none';
}

socket.on('gameState', d => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Gün döngüsü arka plan rengi
    const darkness = Math.abs(Math.sin(d.frameCount * 0.003)) * 100;
    const bg = `rgb(${255-darkness}, ${192-darkness/2}, ${203-darkness/2})`;
    
    // --- ÜST EKRAN (CEYLAN) ---
    drawWorld(0, bg, 'Ceylan', d);
    
    // --- ALT EKRAN (HAKKI) ---
    drawWorld(canvas.height / 2, bg, 'Hakkı', d);
    
    // Orta Ayırıcı Çizgi
    ctx.fillStyle = "white";
    ctx.fillRect(0, canvas.height / 2 - 2, canvas.width, 4);
});

function drawWorld(offsetY, bgColor, role, data) {
    const worldHeight = canvas.height / 2;
    ctx.save();
    ctx.translate(0, offsetY);
    
    // Arka Plan
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, worldHeight);

    // Borular (Bölgeye göre ölçeklenmiş)
    const scaleY = worldHeight / 300;
    data.pipes.forEach(p => {
        ctx.fillStyle = "#2ecc71"; // Boru Yeşili
        ctx.strokeStyle = "#27ae60"; ctx.lineWidth = 2;
        // Üst Boru
        ctx.fillRect(p.x, 0, 50, p.top * scaleY);
        ctx.strokeRect(p.x, 0, 50, p.top * scaleY);
        // Alt Boru
        ctx.fillRect(p.x, p.bottom * scaleY, 50, worldHeight - (p.bottom * scaleY));
        ctx.strokeRect(p.x, p.bottom * scaleY, 50, worldHeight - (p.bottom * scaleY));
    });

    // Oyuncu (Sadece o dünyaya ait olanı çiz)
    for (let id in data.players) {
        let p = data.players[id];
        if (p.role === role) {
            drawHeart(ctx, 100, p.y * scaleY, 35 * scaleY, p.heartColor);
            ctx.fillStyle = "white"; ctx.font = "bold 16px Arial";
            ctx.fillText(`${p.role} Ölüm: ${p.deaths}`, 20, 30);
        }
    }
    ctx.restore();
}

function drawHeart(ctx, x, y, size, color) {
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(x, y + size/4);
    ctx.quadraticCurveTo(x, y, x + size/4, y);
    ctx.quadraticCurveTo(x + size/2, y, x + size/2, y + size/4);
    ctx.quadraticCurveTo(x + size/2, y, x + size*3/4, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + size/4);
    ctx.quadraticCurveTo(x + size, y + size/2, x + size/2, y + size*3/4);
    ctx.quadraticCurveTo(x, y + size/2, x, y + size/4);
    ctx.fill();
}

// Olay dinleyicileri
socket.on('gameOver', t => { document.getElementById('win-screen').style.display='flex'; document.getElementById('win-text').innerHTML=t; });
socket.on('resetClient', () => location.reload());
window.addEventListener('touchstart', (e) => { if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') socket.emit('jump'); });
window.addEventListener('keydown', e => { if(e.code === 'Space') socket.emit('jump'); });
