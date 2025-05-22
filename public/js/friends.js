var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var _this = this;
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded and parsed");
  var friendRequestForm = document.querySelector("#friend-request-form");
  if (friendRequestForm) {
    friendRequestForm.addEventListener("submit", function (event) {
      return __awaiter(_this, void 0, void 0, function () {
        var friendIdInput,
          friendId,
          response,
          result,
          friend_id_1,
          username,
          friendsListContainer,
          newFriendRequest_1,
          removeButton,
          error_1;
        var _this = this;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              event.preventDefault(); // Prevent the default form submission
              friendIdInput = document.querySelector('input[name="friendId"]');
              friendId =
                friendIdInput === null || friendIdInput === void 0
                  ? void 0
                  : friendIdInput.value;
              _a.label = 1;
            case 1:
              _a.trys.push([1, 4, , 5]);
              return [
                4 /*yield*/,
                fetch("/friends/send", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ friendId: friendId }),
                }),
              ];
            case 2:
              response = _a.sent();
              return [4 /*yield*/, response.json()];
            case 3:
              result = _a.sent();
              if (response.ok) {
                // Clear the input field
                friendIdInput.value = "";
                (friend_id_1 = result.friend_id), (username = result.username);
                friendsListContainer = document.querySelector(
                  'div[style*="height: 100px"]',
                );
                if (friendsListContainer) {
                  newFriendRequest_1 = document.createElement("div");
                  newFriendRequest_1.style.display = "flex";
                  newFriendRequest_1.style.justifyContent = "space-between";
                  newFriendRequest_1.style.padding = "5px";
                  newFriendRequest_1.innerHTML = "\n              <span>"
                    .concat(username, "#")
                    .concat(
                      friend_id_1,
                      '</span>\n              <button type="button" class="remove-friend" data-id="',
                    )
                    .concat(friend_id_1, '">Pending</button>\n            ');
                  friendsListContainer.appendChild(newFriendRequest_1);
                  removeButton =
                    newFriendRequest_1.querySelector(".remove-friend");
                  if (removeButton) {
                    removeButton.addEventListener("click", function (event) {
                      return __awaiter(_this, void 0, void 0, function () {
                        var removeResponse, error_2;
                        return __generator(this, function (_a) {
                          switch (_a.label) {
                            case 0:
                              event.preventDefault();
                              _a.label = 1;
                            case 1:
                              _a.trys.push([1, 3, , 4]);
                              return [
                                4 /*yield*/,
                                fetch("/friends/remove", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    friendId: friend_id_1,
                                  }),
                                }),
                              ];
                            case 2:
                              removeResponse = _a.sent();
                              if (removeResponse.ok) {
                                newFriendRequest_1.remove(); // Remove the friend entry from the DOM
                              } else {
                                alert("Error removing friend.");
                              }
                              return [3 /*break*/, 4];
                            case 3:
                              error_2 = _a.sent();
                              console.error("Error:", error_2);
                              alert(
                                "An error occurred while removing the friend.",
                              );
                              return [3 /*break*/, 4];
                            case 4:
                              return [2 /*return*/];
                          }
                        });
                      });
                    });
                  }
                }
              } else {
                alert("Error sending friend request: " + result.error);
              }
              return [3 /*break*/, 5];
            case 4:
              error_1 = _a.sent();
              console.error("Error:", error_1);
              alert("An error occurred while sending the friend request.");
              return [3 /*break*/, 5];
            case 5:
              return [2 /*return*/];
          }
        });
      });
    });
  }
  var acceptButtons = document.querySelectorAll(".approve-friend");
  acceptButtons.forEach(function (button) {
    button.addEventListener("click", function (event) {
      return __awaiter(_this, void 0, void 0, function () {
        var friendId, response, result, error_3;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              event.preventDefault();
              friendId = button.getAttribute("data-id");
              _a.label = 1;
            case 1:
              _a.trys.push([1, 4, , 5]);
              return [
                4 /*yield*/,
                fetch("/friends/accept", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ friendId: friendId }),
                }),
              ];
            case 2:
              response = _a.sent();
              return [4 /*yield*/, response.json()];
            case 3:
              result = _a.sent();
              if (response.ok) {
                location.reload(); // Reload the page to update the friends list
              } else {
                alert("Error accepting friend request: " + result.error);
              }
              return [3 /*break*/, 5];
            case 4:
              error_3 = _a.sent();
              console.error("Error:", error_3);
              alert("An error occurred while accepting the friend request.");
              return [3 /*break*/, 5];
            case 5:
              return [2 /*return*/];
          }
        });
      });
    });
  });
  var rejectButtons = document.querySelectorAll(".reject-friend");
  rejectButtons.forEach(function (button) {
    button.addEventListener("click", function (event) {
      return __awaiter(_this, void 0, void 0, function () {
        var friendId, response, result, error_4;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              event.preventDefault();
              friendId = button.getAttribute("data-id");
              console.log("Friend ID to reject:", friendId); // Debugging line
              _a.label = 1;
            case 1:
              _a.trys.push([1, 4, , 5]);
              return [
                4 /*yield*/,
                fetch("/friends/reject", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ friendId: friendId }),
                }),
              ];
            case 2:
              response = _a.sent();
              return [4 /*yield*/, response.json()];
            case 3:
              result = _a.sent();
              if (response.ok) {
                location.reload(); // Reload the page to update the friends list
              } else {
                alert("Error rejecting friend request: " + result.error);
              }
              return [3 /*break*/, 5];
            case 4:
              error_4 = _a.sent();
              console.error("Error:", error_4);
              alert("An error occurred while rejecting the friend request.");
              return [3 /*break*/, 5];
            case 5:
              return [2 /*return*/];
          }
        });
      });
    });
  });
  var removeFriendsButtons = document.querySelectorAll(".remove-friend");
  removeFriendsButtons.forEach(function (button) {
    button.addEventListener("click", function (event) {
      return __awaiter(_this, void 0, void 0, function () {
        var friendId, response, result, error_5;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              event.preventDefault();
              friendId = button.getAttribute("data-id");
              console.log("Friend ID to remove:", friendId); // Debugging line
              _a.label = 1;
            case 1:
              _a.trys.push([1, 4, , 5]);
              return [
                4 /*yield*/,
                fetch("/friends/remove", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ friendId: friendId }),
                }),
              ];
            case 2:
              response = _a.sent();
              return [4 /*yield*/, response.json()];
            case 3:
              result = _a.sent();
              if (response.ok) {
                location.reload(); // Reload the page to update the friends list
              } else {
                alert("Error removing friend: " + result.error);
              }
              return [3 /*break*/, 5];
            case 4:
              error_5 = _a.sent();
              console.error("Error:", error_5);
              alert("An error occurred while removing the friend.");
              return [3 /*break*/, 5];
            case 5:
              return [2 /*return*/];
          }
        });
      });
    });
  });
});
