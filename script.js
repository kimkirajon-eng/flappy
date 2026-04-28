const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let myRole = ""; 
let askActive = true;

// Ekran boyutunu tam sayfa yap
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.onresize = resize;
resize();

// 1. Adım: Karakter Seçimi (Hakkı veya Ceylan)
function pickRole(r) {
    myRole = r;
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step2').classList.add('active');
    document.getElementById('role-title').innerText = "Hoş geldin " + r;
    
    // Sadece Ceylan ölüm sınırını belirleyebilir
    if(r === 'Ceylan') {
        document.getElementById('ceylan-only').style.display = 'block';
    }
    // Sadece Hakkı Aşk Modu butonunu kontrol edebilir
    if(r === 'Hakkı') {
        document.getElementById('ask-btn-area').style.display = 'block';
    }
}

// 2. Adım: Detayları Gönder ve Oyuna Gir
function finishSetup() {
    const bet = document.getElementById('betInput').value;
    const limit = document.getElementById('limitInput').value;
    const heartColor = document.getElementById('hColor').value;

    if(!bet) {
        alert("Lütfen neyine oynadığınızı yazın! ❤️");
        return;
    }

    socket.emit('join', {
        role: myRole,
        bet: bet,
        limit: limit,
        heartColor: heartColor
    });
    
    document.getElementById('overlay').style.display = 'none';
}

// Aşk Modu Kontrolü (Hakkı tarafı)
function toggleAsk() {
    askActive = !askActive;
    socket.emit('toggleAskModu', askActive);
    const btn = document.getElementById('askBtn');
    btn.innerText = "Aşk Modu: " + (askActive ? "AÇIK" : "KAPALI");
    btn.style.background = askActive ? "#ff69b4" : "#555";
}

// Mesajlaşma Paneli
function toggleChat() {
    const area = document.getElementById('chat-input-area');
    area.style.display = (area.style.display === 'none' || area.style.display === '') ? 'block' : 'none';
    if(area.style.display === 'block') document.getElementById('cMsg').focus();
}

function sendChat(e) {
    if(e.key === 'Enter') {
        const msg = e.target.value;
        if(msg.trim() !== "") {
            socket.emit('chat', msg);
            e.target.value = "";
            toggleChat();
        }
    }
}

// Yeniden Başlatma İsteği
function requestRestart() {
    socket.emit('restartRequest');
}

// Sunucudan Gelen Komutlar
socket.on('resetClient', () => {
    window.location.reload(); // Herkesi en başa döndür
});

socket.on('gameOver', (text) => {
    document.getElementById('win-screen').style.display = 'flex';
    document.getElementById('win-text').innerHTML = text;
});

// Oyunun Çizim Döngüsü
socket.on('gameState', (data) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Engelleri Çiz (Pembe Kalpler)
    data.pipes.forEach(p => {
        drawHeart(ctx, p.x, p.top, 40, "#ff69b4");
        // Alt engel (isteğe bağlı eklenebilir)
        if(p.bottom) drawHeart(ctx, p.x, p.bottom, 40, "#ff69b4");
    });

    // Oyuncuları Çiz (Seçtikleri renklerde kalpler)
    for (let id in data.players) {
        let p = data.players[id];
        drawHeart(ctx, 100, p.y, 45, p.heartColor);
        
        // Karakter İsmi ve Ölüm Sayısı
        ctx.fillStyle = "#d02090";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${p.role} (${p.deaths})`, 122, p.y - 15);
    }
});

// Kalp Çizim Fonksiyonu
function drawHeart(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.quadraticCurveTo(x, y, x + size / 4, y);
    ctx.quadraticCurveTo(x + size / 2, y, x + size / 2, y + size / 4);
    ctx.quadraticCurveTo(x + size / 2, y, x + size * 3 / 4, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + size / 4);
    ctx.quadraticCurveTo(x + size, y + size / 2, x + size / 2, y + size * 3 / 4);
    ctx.quadraticCurveTo(x, y + size / 2, x, y + size / 4);
    ctx.fill();
}

// Kontroller (Boşluk tuşu ve Dokunmatik)
window.addEventListener('keydown', (e) => {
    if(e.code === 'Space') socket.emit('jump');
});

window.addEventListener('touchstart', (e) => {
    // Butonlara veya inputlara tıklandığında zıplamayı engelle
    if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
        socket.emit('jump');
    }
});
