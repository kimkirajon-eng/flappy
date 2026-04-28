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
let comboCount = 0;
let showTogetherMessage = true;
let highScore = { name: "Yok", score: 0 };

function createPipe() {
    const gap = 170;
    const height = Math.floor(Math.random() * 250) + 50;
    pipes.push({ x: 600, top: height, bottom: height + gap, scored: false });
}

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        players[socket.id] = { 
            role: data.role, 
            bet: data.bet || "Zevkine",
            y: 300, velocity: 0, score: 0, deaths: 0, alive: true,
            color: data.role === 'Ceylanım' ? '#ff4d4d' : '#4d94ff',
            heartColor: data.heartColor || '#ff4d4d'
        };
        if(data.role === 'Ceylanım' && data.limit) deathLimit = parseInt(data.limit);
        io.emit('highScoreUpdate', highScore);
    });

    socket.on('toggleMessage', (val) => {
        if (players[socket.id]?.role === 'Ben') showTogetherMessage = val; // 'Ben' rolü (Hakkı) kontrol eder
    });

    socket.on('jump', () => {
        if (players[socket.id]) {
            if (!players[socket.id].alive) { players[socket.id].alive = true; players[socket.id].y = 300; }
            players[socket.id].velocity = -6;
        }
    });

    socket.on('sendEmoji', (emoji) => {
        io.emit('showEmoji', { emoji, from: players[socket.id]?.role });
    });

    socket.on('signal', (data) => socket.broadcast.emit('signal', data));
    socket.on('disconnect', () => { delete players[socket.id]; });
});

setInterval(() => {
    frameCount++;
    if (frameCount % 100 === 0) createPipe();
    pipes.forEach(p => p.x -= 3);

    let bothAlive = Object.values(players).length >= 2 && Object.values(players).every(p => p.alive);
    
    pipes.forEach(p => {
        if (p.x < 100 && !p.scored) {
            p.scored = true;
            if (bothAlive) comboCount++;
            for (let id in players) {
                players[id].score++;
                if (players[id].score > highScore.score) {
                    highScore = { name: players[id].role, score: players[id].score };
                    io.emit('highScoreUpdate', highScore);
                }
            }
        }
    });

    pipes = pipes.filter(p => p.x > -60);

    for (let id in players) {
        let p = players[id];
        if (!p.alive) continue;
        p.velocity += 0.25; p.y += p.velocity;
        if (p.y > 600 || p.y < 0) { p.alive = false; p.deaths++; comboCount = 0; }
        
        pipes.forEach(pipe => {
            if (100 + 25 > pipe.x && 100 < pipe.x + 50 && (p.y < pipe.top || p.y + 25 > pipe.bottom)) {
                p.alive = false; p.deaths++; comboCount = 0;
            }
        });
    }
    io.emit('gameState', { players, pipes, frameCount, comboCount, deathLimit, showTogetherMessage });
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
