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
    /***/ "./src/client/js/lobby.ts":
      /*!********************************!*\
  !*** ./src/client/js/lobby.ts ***!
  \********************************/
      /***/ () => {
        eval(
          '\nconst createGameButton = document.querySelector("#show-create-form");\nconst createGameContainer = document.querySelector("#create-game-container");\nconst hideCreateGameContainer = document.querySelector("#hide-create-form");\ncreateGameButton.addEventListener("click", (e) => {\n    e.preventDefault();\n    console.log("create game button clicked");\n    createGameContainer.classList.toggle("hidden");\n});\nconsole.log(hideCreateGameContainer);\nconsole.log("ddd");\nhideCreateGameContainer.addEventListener("click", (e) => {\n    e.preventDefault();\n    console.log("hide create game form button clicked");\n    createGameContainer.classList.toggle("hidden");\n});\ncreateGameContainer.addEventListener("click", (e) => {\n    if (e.target === createGameContainer) {\n        console.log("clicked outside of form");\n        createGameContainer.classList.toggle("hidden");\n    }\n});\n\n\n//# sourceURL=webpack://term-project-jarl/./src/client/js/lobby.ts?',
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
  /******/ __webpack_modules__["./src/client/js/lobby.ts"]();
  /******/
  /******/
})();
