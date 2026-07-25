/** @jest-environment node */

const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, 'scripts', 'verify-no-stale-model.js');

describe('verify-no-stale-model', () => {
  it('passes on the current repository tree', () => {
    const out = execFileSync(process.execPath, [SCRIPT], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(out).toMatch(/PASS no prohibited Gemma references/);
  });
});
