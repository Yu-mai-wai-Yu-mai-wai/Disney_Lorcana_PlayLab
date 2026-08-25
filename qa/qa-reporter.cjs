// Custom Playwright Reporter — pushes each test result to the QA Dashboard in real time
// Maps test annotations/tags like @TC-UXUI-001 to master-sheet rows.
const http = require('http');

function push(payload) {
  return new Promise(resolve => {
    const body = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost', port: 9200, path: '/api/update', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 3000,
    }, res => { res.resume(); res.on('end', resolve); });
    req.on('error', () => resolve());
    req.on('timeout', () => { req.destroy(); resolve(); });
    req.end(body);
  });
}

class QADashboardReporter {
  onTestEnd(test, result) {
    const tags = test.tags || [];
    const tag = tags.find(t => /@TC-/.test(t));
    const caseId = tag ? tag.replace('@', '') : null;
    if (!caseId) return;
    const status = result.status === 'passed' ? 'PASS' : (result.status === 'skipped' ? 'BLOCKED' : 'FAIL');
    const errors = (result.errors || []).map(e => e.message?.split('\n')[0]).filter(Boolean).slice(0, 2).join(' | ');
    return push({
      caseId,
      status,
      actual: status === 'PASS' ? `ผ่านตาม Expected (${new Date().toLocaleTimeString('th-TH')})` : `${result.status}: ${errors || 'see trace'}`,
      remark: status === 'FAIL' ? 'BUG — ดู playwright-report/index.html' : '',
    });
  }
}

module.exports = QADashboardReporter;
