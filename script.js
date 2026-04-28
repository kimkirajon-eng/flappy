socket.on('gameState', (data) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Ekranı temizle
    // Boruları çiz
    data.pipes.forEach(pipe => {
        ctx.fillStyle = 'green';
        ctx.fillRect(pipe.x, 0, 50, pipe.top);
        ctx.fillRect(pipe.x, pipe.bottom, 50, canvas.height);
    });
    // Oyuncuları çiz
    for (let id in data.players) {
        let p = data.players[id];
        ctx.fillStyle = p.color;
        ctx.fillRect(100, p.y, 25, 25);
    }
});
