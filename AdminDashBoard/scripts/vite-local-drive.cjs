// Vite probes `net use` on Windows to detect network drives. This workspace is
// on a local drive, and the restricted test environment denies child processes.
// Return the equivalent empty mapping for that optional probe only.
const childProcess = require("node:child_process");
const originalExec = childProcess.exec;
childProcess.exec = function (command, ...args) {
  if (command === "net use") {
    const callback = args[args.length - 1];
    queueMicrotask(() => callback(null, "", ""));
    return { on() {}, kill() {} };
  }
  return originalExec.call(this, command, ...args);
};
require("node:module").syncBuiltinESMExports();
