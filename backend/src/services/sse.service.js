// Map of userId → Set of active response objects (one per open tab).
const clients = new Map();

function addClient(userId, res) {
    if (!clients.has(userId)) clients.set(userId, new Set());
    clients.get(userId).add(res);
}

function removeClient(userId, res) {
    const set = clients.get(userId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) clients.delete(userId);
}

function sendToUser(userId, eventType, data) {
    const set = clients.get(userId);
    if (!set) return;

    const payload = `data: ${JSON.stringify({ type: eventType, payload: data })}\n\n`;

    for (const res of set) {
        try {
            res.write(payload);
        } catch {
            set.delete(res);
        }
    }

    if (set.size === 0) clients.delete(userId);
}

module.exports = { addClient, removeClient, sendToUser };
