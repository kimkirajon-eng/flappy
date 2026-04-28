const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let myRole = "";

function selectChar(role) {
    myRole = role;
    document.getElementById('char-select').style.display = 'none';
    document.getElementById('bet-area').style.display = 'block';
    if(role === 'Ceylan') document.getElementById('ceylan-extras').style.display = 'block';
    if(role === 'Hakkı') document.getElementById('hakki-controls').style.display = 'block';
}

function startGame() {
    socket.emit('join', { 
        role: myRole, 
        bet: document.getElementById('bet-input').value,
        limit: document.getElementById('limit-input').value,
        heartColor: document.getElementById('heart-color').value
    });
    document.getElementById('setup').style.display = 'none';
}

function toggleMsg(val) { socket.emit('toggleMessage', val); }

function drawHeart(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.quadraticCurveTo(x, y, x + size / 4, y);
    ctx.quadraticCurveTo(x + size / 2, y, x + size / 2, y + size / 4);
    ctx.quadraticCurveTo(x + size / 2, y, x + size * 3/4, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + size / 4);
    ctx.quadraticCurveTo(x + size, y + size / 2, x + size / 2, y + size);
    ctx.quadraticCurveTo(x, y + size / 2, x, y + size / 4);
    ctx.fill();
}

socket.on('gameState', (data) => {
    ctx.clearRect(0, 0, 600, 600);
    
    // Orta Çizgi
    ctx.strokeStyle = "white"; ctx.beginPath(); ctx.moveTo(0,300); ctx.lineTo(600,300); ctx.stroke();

    // Kalpler (Engeller)
    data.pipes.forEach(p => {
        drawHeart(p.x, p.y, 40, "#ff69b4"); // Üst kat kalbi
        drawHeart(p.x, p.y + 300, 40, "#ff69b4"); // Alt kat kalbi
    });

    // Oyuncular
    for (let id in data.players) {
        let p = data.players[id];
        ctx.fillStyle = p.color;
        ctx.fillRect(100, p.y, 25, 25);
    }

    // Birlikte Başarı Mesajı
    if (data.comboCount >= 10 && data.showTogetherMessage) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "white";
        ctx.font = "bold 40px Arial";
        ctx.fillText("Birlikte tüm engelleri aşarız", 50, 310);
        ctx.restore();
    }
});

// Sohbet ve Kontroller
document.getElementById('msg-input').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') { socket.emit('chat', e.target.value); e.target.value = ""; }
});
socket.on('chat', (d) => {
    const m = document.getElementById('messages');
    m.innerHTML += `<div><b>${d.from}:</b> ${d.msg}</div>`;
    m.scrollTop = m.scrollHeight;
});
window.addEventListener('touchstart', () => socket.emit('jump'));
window.addEventListener('keydown', (e) => { if(e.code === 'Space') socket.emit('jump'); });
