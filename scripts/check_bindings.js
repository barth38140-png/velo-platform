const http = require('http');
const net = require('net');

const targets = [
  { url: 'http://127.0.0.1:3000/' },
  { url: 'http://localhost:3000/' },
  { url: 'http://[::1]:3000/' },
  { url: 'http://127.0.0.1:5000/health' },
  { url: 'http://localhost:5000/health' },
  { url: 'http://[::1]:5000/health' },
];

function httpGet(url) {
  return new Promise((resolve) => {
    try {
      const opts = new URL(url);
      const req = http.get(opts, (res) => {
        const { statusCode } = res;
        res.resume();
        resolve({ url, ok: true, statusCode });
      });
      req.on('error', (err) => resolve({ url, ok: false, error: err.message }));
      req.setTimeout(3000, () => { req.destroy(new Error('timeout')); });
    } catch (e) {
      resolve({ url, ok: false, error: e.message });
    }
  });
}

function tcpConnect(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;
    socket.setTimeout(2000);
    socket.on('connect', () => {
      if (done) return; done = true;
      socket.destroy();
      resolve({ host, port, ok: true });
    });
    socket.on('error', (e) => { if (done) return; done = true; resolve({ host, port, ok: false, error: e.message }); });
    socket.on('timeout', () => { if (done) return; done = true; socket.destroy(); resolve({ host, port, ok: false, error: 'timeout' }); });
    socket.connect(port, host);
  });
}

(async () => {
  console.log('=== HTTP checks ===');
  for (const t of targets) {
    const r = await httpGet(t.url);
    console.log(r);
  }

  console.log('\n=== TCP checks ===');
  const tcpTargets = [
    { host: '127.0.0.1', port: 3000 },
    { host: '::1', port: 3000 },
    { host: '127.0.0.1', port: 5000 },
    { host: '::1', port: 5000 },
  ];
  for (const tt of tcpTargets) {
    const r = await tcpConnect(tt.host, tt.port);
    console.log(r);
  }

  console.log('\nDone');
})();
