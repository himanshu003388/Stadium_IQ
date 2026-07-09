/* eslint-disable no-console */
const originalLog = console.log;
// eslint-disable-next-line no-console
const originalError = console.error;

function redact(args) {
  return args.map((arg) => {
    if (typeof arg === 'string') {
      return arg.replace(/AIza[0-9A-Za-z-_]{35}/g, 'AIza[REDACTED]');
    }
    if (typeof arg === 'object' && arg !== null) {
      try {
        let str = JSON.stringify(arg);
        str = str.replace(/AIza[0-9A-Za-z-_]{35}/g, 'AIza[REDACTED]');
        return JSON.parse(str);
      } catch {
        return arg;
      }
    }
    return arg;
  });
}

export function installRedact() {
  console.log = function (...args) {
    originalLog.apply(console, redact(args));
  };
  console.error = function (...args) {
    originalError.apply(console, redact(args));
  };
}
