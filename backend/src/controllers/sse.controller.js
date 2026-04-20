const { addClient, removeClient } = require('../services/sse.service');

const HEARTBEAT_MS = 30_000;

function subscribe(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Initial comment to establish the stream on the client.
    res.write(': connected\n\n');

    addClient(req.user.id, res);

    const heartbeat = setInterval(() => {
        try {
            res.write(': heartbeat\n\n');
        } catch {
            clearInterval(heartbeat);
        }
    }, HEARTBEAT_MS);

    req.on('close', () => {
        clearInterval(heartbeat);
        removeClient(req.user.id, res);
    });
}

module.exports = { subscribe };
