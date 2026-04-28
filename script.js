const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const betList = document.getElementById('bet-list');
const loginScreen = document.getElementById('login');
const joinBtn = document.getElementById('joinBtn');

// Oyuna Katıl Butonu Fonksiyonu
joinBtn.onclick = () => {
    const role = document.getElementById('nick').value;
    const bet = document.getElementById('bet').value;
    if(role) {
        socket.emit('join', { role, bet });
        loginScreen.style.display = 'none'; // Ekranı kesin kapat
    } else {
        alert("Lütfen bir isim gir!");
    }
};

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

        ctx.fillStyle = p.color;
        ctx.fillRect(100, p.y, 25, 25);
        
        ctx.fillStyle = "white";
        ctx.font = "bold 14px Arial";
        ctx.fillText(p.role, 100, p.y - 10);

        const div = document.createElement('div');
        div.style.color = p.color;
        div.innerHTML = `• ${p.role}: ${p.bet} (${p.score})`;
        betList.appendChild(div);
    }
});

// MOBİL VE MASAÜSTÜ KONTROLLERİ
// Ekrana dokunulduğunda veya boşluğa basıldığında zıpla
const jumpAction = (e) => {
    // Eğer giriş ekranı açıksa zıplama çalışmasın
    if (loginScreen.style.display !== 'none') return;
    socket.emit('jump');
    if(e.cancelable) e.preventDefault();
};

window.addEventListener('keydown', (e) => { if(e.code === 'Space') jumpAction(e); });
window.addEventListener('touchstart', jumpAction, {passive: false});
window.addEventListener('mousedown', (e) => { if(e.button === 0) jumpAction(e); });
