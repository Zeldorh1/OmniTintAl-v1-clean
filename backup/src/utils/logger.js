
/**
 * Minimal app-wide logger.
 * - Buffers errors to memory for later upload.
 * - Stubs a send() method you can wire to Sentry or your backend.
 */
const _buffer = [];
export const Logger = {
  info: (...args) => { if (__DEV__) console.log('[INFO]', ...args); },
  warn: (...args) => { console.warn('[WARN]', ...args); },
  error: (...args) => {
    console.error('[ERROR]', ...args);
    try { _buffer.push({ ts: Date.now(), args }); } catch {}
  },
  getBuffer: () => _buffer.slice(-200),
  async send() {
    // TODO: hook into Sentry or your API endpoint
    return { sent: _buffer.length };
  }
};
