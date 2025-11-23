const fs = require('fs');
const path = require('path');

const metricsDir = path.join(__dirname, '..', 'test-metrics');
const historyFile = path.join(metricsDir, 'history.json');
const outFile = path.join(metricsDir, 'report.md');

if (!fs.existsSync(historyFile)) {
  console.error('No metrics history found at', historyFile);
  process.exit(1);
}

const history = JSON.parse(fs.readFileSync(historyFile, 'utf8')) || [];
if (!Array.isArray(history) || history.length === 0) {
  console.error('No metrics entries to report');
  process.exit(1);
}

const latest = history[history.length - 1];
const prev = history.length > 1 ? history[history.length - 2] : null;

function fmt(n) {
  if (n == null) return '-';
  return typeof n === 'number' ? n.toFixed(3) + 's' : String(n);
}

let md = `# Vitest Metrics Report\n\n`;
md += `**Generated:** ${new Date(latest.timestamp).toISOString()}\n\n`;
md += `## Latest Run\n\n`;
md += `- Total: ${fmt(latest.total)}\n`;
md += `- Setup: ${fmt(latest.setup)}\n`;
md += `- Tests: ${fmt(latest.tests)}\n`;
md += `- Transform: ${fmt(latest.transform)}\n`;
md += `- Collect: ${fmt(latest.collect)}\n`;
md += `- Environment: ${fmt(latest.environment)}\n`;
md += `- Prepare: ${fmt(latest.prepare)}\n\n`;

if (prev) {
  const delta = (latest.total - (prev.total || 0));
  md += `## Delta vs previous run (${prev.timestamp})\n\n`;
  md += `- Total delta: ${delta >= 0 ? '+' : ''}${delta.toFixed(3)}s\n\n`;
}

md += `## History (most recent first)\n\n`;
md += `| Time | Total | Setup | Tests | Transform | Collect |\n`;
md += `| ---- | -----:| ----:| ----:| -------:| ------:|\n`;
const rows = history.slice().reverse().map(h => {
  return `| ${new Date(h.timestamp).toISOString()} | ${fmt(h.total)} | ${fmt(h.setup)} | ${fmt(h.tests)} | ${fmt(h.transform)} | ${fmt(h.collect)} |`;
});
md += rows.join('\n') + '\n';

fs.mkdirSync(metricsDir, { recursive: true });
fs.writeFileSync(outFile, md);
console.log('Wrote metrics report to', outFile);
