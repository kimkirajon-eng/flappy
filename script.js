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
    }
}

socket.on('gameState', (data) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // İddia Listesini Güncelle
    betList.innerHTML = "";
    
    // Boruları Çiz
    ctx.fillStyle = "#2ecc71";
    data.pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, 50, pipe.top);
        ctx.fillRect(pipe.x, pipe.bottom, 50, canvas.height - pipe.bottom);
    });

    // Oyuncuları Çiz
    for (let id in data.players) {
        let p = data.players[id];
        if (!p.alive) continue;

        ctx.fillStyle = p.color;
        ctx.fillRect(100, p.y, 25, 25);
        
        // İsmi kafasının üstüne yaz
        ctx.fillStyle = "white";
        ctx.font = "12px Arial";
        ctx.fillText(p.role, 100, p.y - 5);

        // İddia listesine ekle
        const betItem = document.createElement('div');
        betItem.style.color = p.color;
        betItem.innerHTML = `<strong>${p.role}:</strong> ${p.bet} (${p.score} Puan)`;
        betList.appendChild(betItem);
    }
});

window.addEventListener('keydown', (e) => {
    if(e.code === 'Space') socket.emit('jump');
});

// Mobil dokunuş desteği
window.addEventListener('touchstart', () => socket.emit('jump'));
