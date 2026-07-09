/**
 * Stadium IQ - Load / Stress Test Script (autocannon)
 * Run: node scripts/load-test.js [duration_seconds]
 * Requires: npm install autocannon
 */
const autocannon = require('autocannon');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const DURATION = parseInt(process.argv[2], 10) || 30;

const endpoints = [
  { method: 'GET', path: '/api/health', title: 'Health Check' },
  { method: 'GET', path: '/api/csrf-token', title: 'CSRF Token' },
  {
    method: 'POST',
    path: '/api/chat',
    title: 'AI Chat',
    body: JSON.stringify({ message: 'Which gate is least busy?', language: 'en', contextData: {} }),
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'loadtest' },
  },
];

async function runLoadTest(endpoint) {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: BASE_URL,
        connections: 10,
        pipelining: 1,
        duration: DURATION,
        method: endpoint.method,
        path: endpoint.path,
        body: endpoint.body,
        headers: endpoint.headers,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      },
    );

    process.stdout.write(
      `\nRunning load test: ${endpoint.title} (${endpoint.method} ${endpoint.path})\n`,
    );
    autocannon.track(instance, { renderProgressBar: true });
  });
}

async function main() {
  console.log(`\n═══ Stadium IQ Load Tests ═══`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Duration: ${DURATION}s per endpoint\n`);

  const results = [];
  for (const endpoint of endpoints) {
    try {
      const result = await runLoadTest(endpoint);
      results.push({ endpoint: endpoint.title, ...result });
    } catch (err) {
      console.error(`Failed to test ${endpoint.title}: ${err.message}`);
    }
  }

  console.log(`\n═══ Results Summary ═══\n`);
  for (const r of results) {
    console.log(`${r.endpoint}:`);
    console.log(`  Requests: ${r.requests.total} total | ${r.requests.average} avg/sec`);
    console.log(`  Latency: ${r.latency.average}ms avg | ${r.latency.p99}ms p99`);
    console.log(`  Throughput: ${(r.throughput.total / 1024 / 1024).toFixed(2)} MB total`);
    console.log(`  Errors: ${r.errors} | Timeouts: ${r.timeouts}`);
    console.log(`  2xx: ${r.statusCodeStats?.['200'] || r.statusCodeStats?.['201'] || 0}`);
    console.log(`  4xx/5xx: ${r.non2xx || 0}\n`);
  }

  const totalRequests = results.reduce((s, r) => s + r.requests.total, 0);
  const avgLatency = results.reduce((s, r) => s + r.latency.average, 0) / results.length;
  const totalErrors = results.reduce((s, r) => s + r.errors + r.timeouts, 0);

  console.log(`═══ Overall ═══`);
  console.log(`Total requests: ${totalRequests}`);
  console.log(`Average latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`Total errors/timeouts: ${totalErrors}`);
  console.log(`Status: ${totalErrors === 0 ? '✅ PASS' : '⚠️  HAS ERRORS'}\n`);
}

main().catch(console.error);
