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

// Orijinal Flappy Bird Fiziği Değerleri
const GRAVITY = 0.25;
const JUMP_STRENGTH = -5.5;
const PIPE_SPEED = 3.5;

function createPipe() {
    const gap = 140; // Geçiş boşluğu
    const minPipeHeight = 50;
    const maxPipeHeight = 110; 
    const height = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight)) + minPipeHeight;
    pipes.push({ x: 600, top: height, bottom: height + gap, scored: false });
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        players[socket.id] = { 
            role: data.role, bet: data.bet, heartColor: data.heartColor,
            y: 150, velocity: 0, deaths: 0, alive: true
        };
        if(data.role === 'Ceylan' && data.limit) deathLimit = parseInt(data.limit);
        if(data.role === 'Hakkı') askModu = data.askModu;
    });

    socket.on('jump', () => {
        if (gameStatus === "playing" && players[socket.id]) {
            players[socket.id].velocity = JUMP_STRENGTH;
            if(!players[socket.id].alive) {
                players[socket.id].alive = true;
                players[socket.id].y = 150;
            }
        }
    });

    socket.on('restartRequest', () => {
        players = {}; pipes = []; frameCount = 0; gameStatus = "playing";
        io.emit('resetClient');
    });

    socket.on('chat', (msg) => io.emit('chat', { from: players[socket.id]?.role, msg }));
    socket.on('disconnect', () => { delete players[socket.id]; });
});

setInterval(() => {
    if (gameStatus !== "playing") return;
    frameCount++;
    if (frameCount % 90 === 0) createPipe();
    pipes.forEach(p => p.x -= PIPE_SPEED);
    pipes = pipes.filter(p => p.x > -100);

    for (let id in players) {
        let p = players[id];
        p.velocity += GRAVITY;
        p.y += p.velocity;

        // Tavan ve Taban Çarpışması (300px limit)
        if (p.y < 0 || p.y > 270) {
            p.alive = false; p.deaths++; p.y = 150; p.velocity = 0;
        }

        // Boru Çarpışması
        pipes.forEach(pipe => {
            if (100 + 25 > pipe.x && 100 < pipe.x + 50) {
                if (p.y < pipe.top || p.y + 25 > pipe.bottom) {
                    p.alive = false; p.deaths++; p.y = 150; p.velocity = 0;
                }
            }
        });

        if (p.deaths >= deathLimit) {
            gameStatus = "finished";
            let cP = Object.values(players).find(pl => pl.role === "Ceylan");
            let winner = askModu ? "Ceylan" : (p.role === "Ceylan" ? "Hakkı" : "Ceylan");
            io.emit('gameOver', `<b>${winner} Kazandı!</b><br>İddia: ${cP ? cP.bet : 'Aşk'}`);
        }
    }
    io.emit('gameState', { players, pipes, frameCount });
}, 1000 / 60);

http.listen(process.env.PORT || 3000, '0.0.0.0');
