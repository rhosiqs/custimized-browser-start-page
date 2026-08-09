(function initializeCore(globalScope) {
  "use strict";

  const core = Object.freeze({
    version: 1
  });

  globalScope.StartPageCore = core;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = core;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);

