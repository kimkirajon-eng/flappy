const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let myRole = "";

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

function toggleChatIn() {
    const i = document.getElementById('chatIn');
    i.style.display = i.style.display === 'none' ? 'block' : 'none';
    if(i.style.display === 'block') i.focus();
}

function sendChat(e) {
    if(e.key === 'Enter') {
        socket.emit('chat', e.target.value);
        e.target.value = ""; e.target.style.display = 'none';
    }
}

socket.on('gameState', d => {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    
    // Gün Döngüsü Arka Planı
    const darkness = Math.abs(Math.sin(d.frameCount * 0.003)) * 120;
    ctx.fillStyle = `rgb(${255-darkness}, ${192-darkness/2}, ${203-darkness/2})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Orta Çizgi
    ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, canvas.height/2); ctx.lineTo(canvas.width, canvas.height/2); ctx.stroke();

    const scale = canvas.height / 600;

    d.pipes.forEach(p => {
        ctx.fillStyle = "#2ecc71";
        // Ceylan Ekranı (Üst)
        ctx.fillRect(p.x, 0, 50, p.top * scale);
        ctx.fillRect(p.x, p.bottom * scale, 50, canvas.height/2);
        // Hakkı Ekranı (Alt)
        ctx.fillRect(p.x, canvas.height/2, 50, p.top * scale);
        ctx.fillRect(p.x, (canvas.height/2) + (p.bottom * scale), 50, canvas.height);
    });

    for (let id in d.players) {
        let p = d.players[id];
        let baseHeight = (p.role === 'Ceylan' ? 0 : canvas.height/2);
        drawHeart(ctx, 100, baseHeight + (p.y * scale), 35, p.heartColor);
        ctx.fillStyle = "white"; ctx.font = "bold 16px Arial";
        ctx.fillText(`${p.role}: ${p.deaths}`, 20, baseHeight + 30);
    }
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
socket.on('chat', d => { document.getElementById('msgs').innerHTML = `<b>${d.from}:</b> ${d.msg}`; });

window.addEventListener('touchstart', (e) => { if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') socket.emit('jump'); });
window.addEventListener('keydown', e => { if(e.code === 'Space') socket.emit('jump'); });
