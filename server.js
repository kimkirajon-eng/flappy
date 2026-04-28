const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let players = {};
let pipes = [];
let comboCount = 0; // İki oyuncunun beraber geçtiği engel sayısı
let deathLimit = 10;
let showTogetherMessage = true; // Hakkı'nın kontrolündeki ayar

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        players[socket.id] = { 
            role: data.role, 
            y: data.role === 'Hakkı' ? 150 : 450,
            velocity: 0, deaths: 0, alive: true, score: 0,
            color: data.role === 'Ceylan' ? '#ff4d4d' : '#4d94ff',
            heartColor: data.heartColor || '#ff0000'
        };
        if(data.role === 'Ceylan' && data.limit) deathLimit = parseInt(data.limit);
    });

    socket.on('toggleMessage', (val) => {
        if (players[socket.id]?.role === 'Hakkı') showTogetherMessage = val;
    });

    socket.on('jump', () => { if (players[socket.id]) players[socket.id].velocity = -6; });
    socket.on('chat', (msg) => { io.emit('chat', { from: players[socket.id]?.role, msg }); });
    socket.on('disconnect', () => { delete players[socket.id]; });
});

setInterval(() => {
    if (Math.random() < 0.02) {
        const height = Math.floor(Math.random() * 150) + 50;
        pipes.push({ x: 600, y: height, scored: false });
    }
    pipes.forEach(p => p.x -= 3);
    
    // Skor ve Combo Mantığı
    pipes.forEach(p => {
        if (p.x < 100 && !p.scored) {
            p.scored = true;
            comboCount++; 
        }
    });

    pipes = pipes.filter(p => p.x > -50);

    for (let id in players) {
        let p = players[id];
        p.velocity += 0.25; p.y += p.velocity;
        let limitTop = p.role === 'Hakkı' ? 0 : 300;
        let limitBottom = p.role === 'Hakkı' ? 300 : 600;
        
        if (p.y < limitTop || p.y > limitBottom - 25) {
            p.deaths++; p.y = limitTop + 50; p.velocity = 0;
            comboCount = 0; // Biri yanarsa beraberlik bozulur
        }
    }
    io.emit('gameState', { players, pipes, comboCount, deathLimit, showTogetherMessage });
}, 1000 / 60);

http.listen(process.env.PORT || 3000, '0.0.0.0');
