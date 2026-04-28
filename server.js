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
let gameStatus = "playing"; // "playing" or "finished"

function resetGame() {
    players = {}; pipes = []; frameCount = 0; gameStatus = "playing";
    io.emit('resetClient');
}

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        players[socket.id] = { 
            role: data.role, bet: data.bet, 
            heartColor: data.heartColor, y: 300, 
            velocity: 0, deaths: 0, alive: true, score: 0 
        };
        if(data.role === 'Ceylan' && data.limit) deathLimit = parseInt(data.limit);
        io.emit('playerUpdate', players);
    });

    socket.on('toggleAskModu', (val) => {
        if (players[socket.id]?.role === 'Hakkı') askModu = val;
    });

    socket.on('jump', () => {
        if (gameStatus === "playing" && players[socket.id]) {
            players[socket.id].velocity = -6;
            if(!players[socket.id].alive) players[socket.id].alive = true;
        }
    });

    socket.on('chat', (msg) => {
        io.emit('chat', { from: players[socket.id]?.role, msg });
    });

    socket.on('restartRequest', () => { resetGame(); });

    socket.on('disconnect', () => { delete players[socket.id]; });
});

setInterval(() => {
    if (gameStatus !== "playing") return;
    frameCount++;
    if (frameCount % 100 === 0) {
        const height = Math.floor(Math.random() * 250) + 50;
        pipes.push({ x: 600, top: height, bottom: height + 170 });
    }
    pipes.forEach(p => p.x -= 3);
    pipes = pipes.filter(p => p.x > -60);

    for (let id in players) {
        let p = players[id];
        p.velocity += 0.25; p.y += p.velocity;
        if (p.y > 600 || p.y < 0) { p.alive = false; p.deaths++; p.y = 300; }
        
        // Ölüm Sınırı Kontrolü
        if (p.deaths >= deathLimit) {
            gameStatus = "finished";
            let winner = "Ceylan";
            let winText = "";
            
            if (!askModu) {
                winner = (p.role === "Ceylan") ? "Hakkı" : "Ceylan";
            }
            
            const ceylanPlayer = Object.values(players).find(pl => pl.role === "Ceylan");
            winText = `${winner} Kazandı! <br> İddia: ${ceylanPlayer ? ceylanPlayer.bet : 'Belli değil'}`;
            io.emit('gameOver', winText);
        }
    }
    io.emit('gameState', { players, pipes, askModu });
}, 1000 / 60);

http.listen(process.env.PORT || 3000, '0.0.0.0');
