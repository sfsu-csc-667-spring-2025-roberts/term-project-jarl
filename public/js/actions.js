/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => {
  // webpackBootstrap
  /******/ "use strict";
  /******/ var __webpack_modules__ = {
    /***/ "./src/client/js/actions.ts":
      /*!**********************************!*\
  !*** ./src/client/js/actions.ts ***!
  \**********************************/
      /***/ () => {
        eval(
          '\ndocument.addEventListener("DOMContentLoaded", () => {\n    const callBtn = document.querySelector("#btn-call");\n    const raiseBtn = document.querySelector("#btn-raise");\n    const main = document.querySelector("main");\n    const mainId = main.id;\n    const gameId = parseInt(mainId.split("-")[1]);\n    callBtn === null || callBtn === void 0 ? void 0 : callBtn.addEventListener("click", (e) => {\n        e.preventDefault();\n        callBtn === null || callBtn === void 0 ? void 0 : callBtn.classList.toggle("hidden");\n        fetch(`/actions/${gameId}/call`, { method: "POST" })\n            .then((response) => {\n            if (response.ok) {\n                console.log(`in client, there are ${response} data`);\n            }\n            else {\n                console.error("Failed to call");\n            }\n        });\n    });\n    raiseBtn === null || raiseBtn === void 0 ? void 0 : raiseBtn.addEventListener("click", (e) => {\n        e.preventDefault();\n        raiseBtn === null || raiseBtn === void 0 ? void 0 : raiseBtn.classList.toggle("hidden");\n        fetch(`/actions/${gameId}/raise`, { method: "POST" })\n            .then((response) => {\n            if (response.ok) {\n                console.log(`in client, there are ${response} data`);\n            }\n            else {\n                console.error("Failed to raise");\n            }\n        });\n    });\n});\n\n\n//# sourceURL=webpack://term-project-jarl/./src/client/js/actions.ts?',
        );

        /***/
      },

    /******/
  };
  /************************************************************************/
  /******/
  /******/ // startup
  /******/ // Load entry module and return exports
  /******/ // This entry module can't be inlined because the eval devtool is used.
  /******/ var __webpack_exports__ = {};
  /******/ __webpack_modules__["./src/client/js/actions.ts"]();
  /******/
  /******/
})();
