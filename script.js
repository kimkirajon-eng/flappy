const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const betList = document.getElementById('bet-list');

function joinGame() {
    const role = document.getElementById('nick').value;
    const bet = document.getElementById('bet').value;
    if(role) {
        socket.emit('join', { role, bet });
        document.getElementById('login').style.display = 'none';
    } else {
        alert("Lütfen bir isim gir!");
    }
}

socket.on('gameState', (data) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    betList.innerHTML = "";
    
    // Boruları Çiz
    ctx.fillStyle = "#27ae60";
    data.pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, 50, pipe.top);
        ctx.fillRect(pipe.x, pipe.bottom, 50, canvas.height - pipe.bottom);
    });

    // Oyuncuları Çiz
    for (let id in data.players) {
        let p = data.players[id];
        if (!p.alive) continue;

        // Kuş (Karakter)
        ctx.fillStyle = p.color;
        ctx.fillRect(100, p.y, 25, 25);
        
        // İsim
        ctx.fillStyle = "white";
        ctx.font = "bold 14px Arial";
        ctx.fillText(p.role, 100, p.y - 10);

        // İddia Listesi Güncelleme
        const div = document.createElement('div');
        div.style.color = p.color;
        div.style.marginBottom = "5px";
        div.innerHTML = `<strong>${p.role}:</strong> ${p.bet} <br><small>Skor: ${p.score}</small>`;
        betList.appendChild(div);
    }
});

// Kontroller
window.addEventListener('keydown', (e) => { if(e.code === 'Space') socket.emit('jump'); });
window.addEventListener('touchstart', (e) => { e.preventDefault(); socket.emit('jump'); }, {passive: false});
