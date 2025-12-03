const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const cwd = path.resolve(__dirname, '..');
const historyFile = path.join(cwd, 'test-metrics', 'history.json');

function parseDurationLine(output) {
  const re = /Duration\s+([0-9.]+)s\s*\(([^)]+)\)/i;
  const m = output.match(re);
  if (!m) return null;
  const total = parseFloat(m[1]);
  const parts = m[2].split(',').map(p => p.trim());
  const data = { total };
  for (const part of parts) {
    const pm = part.match(/^([a-zA-Z]+)[:]?\s*([0-9.]+)(ms|s)?$/i);
    if (pm) {
      const key = pm[1].toLowerCase();
      let val = parseFloat(pm[2]);
      const unit = pm[3] || 's';
      if (unit === 'ms') val = val / 1000;
      data[key] = val;
    }
  }
  return data;
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

console.log('Running vitest to collect timings...');
const child = exec('npx vitest run --reporter=dot', { cwd, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
  const combined = `${stdout}\n${stderr}`;
  // strip ANSI escape codes which vitest may include in output
  const clean = combined.replace(/\x1b\[[0-9;]*m/g, '');
  const metrics = parseDurationLine(clean);
  if (!metrics) {
    console.error('Could not parse duration line from vitest output.');
    // still save raw output for inspection
    ensureDir(historyFile);
    const rawFile = path.join(path.dirname(historyFile), `last-run-${Date.now()}.log`);
    fs.writeFileSync(rawFile, combined);
    console.error('Wrote raw output to', rawFile);
    process.exit(err ? 1 : 0);
  }

  // add timestamp and git info if available
  metrics.timestamp = new Date().toISOString();

  // persist to history
  ensureDir(historyFile);
  let history = [];
  try {
    if (fs.existsSync(historyFile)) history = JSON.parse(fs.readFileSync(historyFile, 'utf8')) || [];
  } catch (e) {
    history = [];
  }
  history.push(metrics);
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));

  // print summary and delta
  console.log('Collected metrics:', metrics);
  if (history.length > 1) {
    const prev = history[history.length - 2];
    const delta = (metrics.total - (prev.total || 0)).toFixed(3);
    console.log(`Delta vs previous run: ${delta}s (${prev.total || 0}s -> ${metrics.total}s)`);
  }

  if (err) {
    console.error('Vitest returned an error exit code. See saved log for details if parsing failed.');
    process.exit(err.code || 1);
  }
});

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
