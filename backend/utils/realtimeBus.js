// Lightweight in-process Server-Sent Events bus for real-time notifications.
// Each client opens an EventSource; messages are pushed by `publish(...)`.
// Channels are `${role}:${userId}` (e.g. "parent:42", "staff:7", "global").

const channels = new Map(); // channel -> Set<res>

function subscribe(channel, res) {
    if (!channels.has(channel)) channels.set(channel, new Set());
    channels.get(channel).add(res);
}

function unsubscribe(channel, res) {
    const set = channels.get(channel);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) channels.delete(channel);
}

function publish(channel, event, payload) {
    const set = channels.get(channel);
    if (!set || set.size === 0) return 0;
    const data = `event: ${event}\ndata: ${JSON.stringify(payload || {})}\n\n`;
    let delivered = 0;
    for (const res of set) {
        try {
            res.write(data);
            delivered++;
        } catch (e) {
            try { unsubscribe(channel, res); } catch {}
        }
    }
    return delivered;
}

function broadcastStaff(event, payload) {
    let total = 0;
    for (const ch of channels.keys()) {
        if (ch.startsWith('staff:')) {
            total += publish(ch, event, payload);
        }
    }
    return total;
}

function stats() {
    const out = {};
    for (const [ch, set] of channels.entries()) out[ch] = set.size;
    return out;
}

// Heartbeat every 25s to keep proxies happy
setInterval(() => {
    for (const set of channels.values()) {
        for (const res of set) {
            try { res.write(`: ping\n\n`); } catch {}
        }
    }
}, 25000);

module.exports = { subscribe, unsubscribe, publish, broadcastStaff, stats };
