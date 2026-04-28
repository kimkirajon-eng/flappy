const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let players = {};
let pipes = [];
let frameCount = 0;
let deathLimit = 10;
let askModu = true;
let gameStatus = "playing";

function createPipe() {
    const gap = 150;
    const height = Math.floor(Math.random() * 150) + 50;
    // Her iki ekran için aynı boru koordinatlarını kullanıyoruz
    pipes.push({ x: 600, top: height, bottom: height + gap, scored: false });
}

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        players[socket.id] = { 
            role: data.role, bet: data.bet, 
            heartColor: data.heartColor, 
            y: 150, // Her iki ekranın kendi içindeki başlangıç Y'si
            velocity: 0, deaths: 0, alive: true
        };
        if(data.role === 'Ceylan' && data.limit) deathLimit = parseInt(data.limit);
        if(data.role === 'Hakkı') askModu = data.askModu;
    });

    socket.on('jump', () => {
        if (gameStatus === "playing" && players[socket.id]) {
            players[socket.id].velocity = -6;
            if(!players[socket.id].alive) players[socket.id].alive = true;
        }
    });

    socket.on('chat', (msg) => io.emit('chat', { from: players[socket.id]?.role, msg }));
    socket.on('restartRequest', () => { players = {}; pipes = []; frameCount = 0; gameStatus = "playing"; io.emit('resetClient'); });
    socket.on('disconnect', () => { delete players[socket.id]; });
});

setInterval(() => {
    if (gameStatus !== "playing") return;
    frameCount++;
    if (frameCount % 100 === 0) createPipe();
    pipes.forEach(p => p.x -= 3);
    pipes = pipes.filter(p => p.x > -60);

    for (let id in players) {
        let p = players[id];
        p.velocity += 0.25; p.y += p.velocity;

        // Ekran sınırları ve Boru Çarpışması (Her ekran 300px yüksekliğinde)
        if (p.y < 0 || p.y > 275) { p.alive = false; p.deaths++; p.y = 150; p.velocity = 0; }

        pipes.forEach(pipe => {
            if (100 + 30 > pipe.x && 100 < pipe.x + 50) {
                if (p.y < pipe.top || p.y + 30 > pipe.bottom) {
                    p.alive = false; p.deaths++; p.y = 150; p.velocity = 0;
                }
            }
        });

        if (p.deaths >= deathLimit) {
            gameStatus = "finished";
            let ceylanP = Object.values(players).find(pl => pl.role === "Ceylan");
            let winner = askModu ? "Ceylan" : (p.role === "Ceylan" ? "Hakkı" : "Ceylan");
            io.emit('gameOver', `${winner} Kazandı! <br> İddia: ${ceylanP?.bet || "Aşk"}`);
        }
    }
    io.emit('gameState', { players, pipes, frameCount, askModu });
}, 1000 / 60);

http.listen(process.env.PORT || 3000, '0.0.0.0');
