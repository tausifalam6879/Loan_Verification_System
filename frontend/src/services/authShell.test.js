import fs from 'fs';
import path from 'path';
import vm from 'vm';

test('HTML warmup aborts a stalled connection and clears its timer', async () => {
  jest.useFakeTimers();
  const html = fs.readFileSync(path.join(process.cwd(), 'public/index.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace('%REACT_APP_API_BASE_URL%', 'https://example.test/api');
  const window = {};
  let aborted = false;
  class Controller {
    constructor() { this.signal = {}; }
    abort() { aborted = true; this.signal.reject(new Error('aborted')); }
  }
  vm.runInNewContext(script, {
    window, AbortController: Controller, setTimeout, clearTimeout,
    fetch: (_url, options) => new Promise((_resolve, reject) => { options.signal.reject = reject; })
  });
  const outcome = expect(window.__fintrackAuthWarmup).rejects.toThrow('aborted');
  jest.advanceTimersByTime(20000);
  await outcome;
  expect(aborted).toBe(true);
  expect(jest.getTimerCount()).toBe(0);
  jest.useRealTimers();
});
