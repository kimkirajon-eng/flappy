const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let lastState = null;

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.onresize = resize; resize();

// Karakter seçim fonksiyonları aynı kalacak (pickRole, finishSetup vb.)

socket.on('gameState', (data) => {
    lastState = data; // Veriyi sakla, çizimi requestAnimationFrame yapsın
});

function draw() {
    if (!lastState) { requestAnimationFrame(draw); return; }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const worldH = canvas.height / 2;
    const scale = worldH / 300;

    [0, worldH].forEach((offsetY, idx) => {
        const roleName = idx === 0 ? "Ceylan" : "Hakkı";
        ctx.save();
        ctx.translate(0, offsetY);

        // Arka Plan
        const d = Math.abs(Math.sin(lastState.frameCount * 0.003)) * 80;
        ctx.fillStyle = `rgb(${255-d}, ${192-d/2}, ${203-d/2})`;
        ctx.fillRect(0, 0, canvas.width, worldH);

        // Borular
        ctx.fillStyle = '#2ecc71';
        lastState.pipes.forEach(pipe => {
            ctx.fillRect(pipe.x, 0, 50, pipe.top * scale);
            ctx.fillRect(pipe.x, pipe.bottom * scale, 50, worldH);
        });

        // Oyuncular
        for (let id in lastState.players) {
            let p = lastState.players[id];
            if (p.role === roleName) {
                drawHeart(ctx, 100, p.y * scale, 35 * scale, p.heartColor);
                ctx.fillStyle = "white"; ctx.font = "bold 16px Arial";
                ctx.fillText(`${p.role}: ${p.deaths}`, 20, 30);
            }
        }
        ctx.restore();
    });

    ctx.fillStyle = "white"; ctx.fillRect(0, worldH-2, canvas.width, 4);
    requestAnimationFrame(draw);
}

function drawHeart(ctx, x, y, size, color) {
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(x, y + size/4); ctx.quadraticCurveTo(x, y, x + size/4, y);
    ctx.quadraticCurveTo(x + size/2, y, x + size/2, y + size/4);
    ctx.quadraticCurveTo(x + size/2, y, x + size*3/4, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + size/4);
    ctx.quadraticCurveTo(x + size, y + size/2, x + size/2, y + size*3/4);
    ctx.quadraticCurveTo(x, y + size/2, x, y + size/4); ctx.fill();
}

requestAnimationFrame(draw);

socket.on('resetClient', () => location.reload());
window.addEventListener('touchstart', (e) => { if(e.target.tagName !== 'BUTTON') socket.emit('jump'); });
window.addEventListener('keydown', e => { if(e.code === 'Space') socket.emit('jump'); });
