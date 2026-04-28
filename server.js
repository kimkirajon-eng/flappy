const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

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
    pipes.push({ x: 600, top: height, bottom: height + gap, scored: false });
}

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        players[socket.id] = { 
            role: data.role, bet: data.bet, 
            heartColor: data.heartColor, 
            y: 150, velocity: 0, deaths: 0, alive: true
        };
        // Sadece Ceylan limit belirleyebilir
        if(data.role === 'Ceylan' && data.limit) deathLimit = parseInt(data.limit);
        // Sadece Hakkı Aşk Modu belirleyebilir
        if(data.role === 'Hakkı') askModu = data.askModu;
    });

    socket.on('jump', () => {
        if (gameStatus === "playing" && players[socket.id]) {
            players[socket.id].velocity = -6;
            if(!players[socket.id].alive) players[socket.id].alive = true;
        }
    });

    socket.on('chat', (msg) => io.emit('chat', { from: players[socket.id]?.role, msg }));
    
    socket.on('restartRequest', () => {
        players = {}; pipes = []; frameCount = 0; gameStatus = "playing";
        io.emit('resetClient');
    });

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
        if(!p.alive) continue;
        p.velocity += 0.25; p.y += p.velocity;

        // Çarpışma Kontrolü
        if (p.y < 0 || p.y > 275) { p.alive = false; p.deaths++; p.y = 150; p.velocity = 0; }
        pipes.forEach(pipe => {
            if (100 + 30 > pipe.x && 100 < pipe.x + 50) {
                if (p.y < pipe.top || p.y + 30 > pipe.bottom) {
                    p.alive = false; p.deaths++; p.y = 150; p.velocity = 0;
                }
            }
        });

        // Oyun Bitiş Kontrolü
        if (p.deaths >= deathLimit) {
            gameStatus = "finished";
            let cP = Object.values(players).find(pl => pl.role === "Ceylan");
            let winner = askModu ? "Ceylan" : (p.role === "Ceylan" ? "Hakkı" : "Ceylan");
            io.emit('gameOver', `<b>${winner} Kazandı!</b><br>İddia: ${cP ? cP.bet : 'Aşk'}`);
        }
    }
    io.emit('gameState', { players, pipes, frameCount });
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => console.log(`Server: ${PORT}`));
