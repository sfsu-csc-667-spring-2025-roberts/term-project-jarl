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
    /***/ "./src/client/js/games.ts":
      /*!********************************!*\
  !*** ./src/client/js/games.ts ***!
  \********************************/
      /***/ () => {
        eval(
          '\n/*\nwhen i click the leave game button, the leave game modal should appear (not be hidden)\nif i click no in the modal, it should hide it\nif i click yes, it should call the appropriate route,\nprob delete that game_player_id, update state, and go back to lobby\n*/\nconst leaveGameBtn = document.querySelector("#leave-game-btn");\nconst leaveGameContainer = document.querySelector("#leave-game-container");\nconst leaveGameModal = document.querySelector("#leave-game-modal");\nconst confirmLeaveBtn = document.querySelector("#confirm-leave-btn");\nconst cancelLeaveBtn = document.querySelector("#cancel-leave-btn");\nleaveGameBtn.addEventListener("click", (e) => {\n    e.preventDefault();\n    // console.log("here")\n    leaveGameContainer.classList.toggle("hidden");\n});\ncancelLeaveBtn.addEventListener("click", (e) => {\n    e.preventDefault();\n    leaveGameContainer.classList.toggle("hidden");\n});\n\n\n//# sourceURL=webpack://term-project-jarl/./src/client/js/games.ts?',
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
  /******/ __webpack_modules__["./src/client/js/games.ts"]();
  /******/
  /******/
})();
