document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");

  const friendRequestForm = document.querySelector("#friend-request-form");
  if (friendRequestForm) {
    friendRequestForm.addEventListener("submit", async (event) => {
      event.preventDefault(); // Prevent the default form submission

      const friendIdInput = document.querySelector(
        'input[name="friendId"]',
      ) as HTMLInputElement;
      const friendId = friendIdInput?.value;

      try {
        const response = await fetch("/friends/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ friendId }),
        });

        const result = await response.json();

        if (response.ok) {
          // Clear the input field
          friendIdInput.value = "";

          // Dynamically add the friend request to the friends list
          const friendsListContainer = document.querySelector(
            'div[style*="height: 100px"]',
          );
          if (friendsListContainer) {
            const newFriendRequest = document.createElement("div");
            newFriendRequest.style.display = "flex";
            newFriendRequest.style.justifyContent = "space-between";
            newFriendRequest.style.padding = "5px";

            newFriendRequest.innerHTML = `
                            <span>${friendId}</span>
                            <button type="button" class="remove-friend" data-id="${friendId}">Pending</button>
                        `;

            friendsListContainer.appendChild(newFriendRequest);

            // Add event listener to the new "remove-friend" button
            const removeButton = newFriendRequest.querySelector(
              ".remove-friend",
            ) as HTMLButtonElement;
            if (removeButton) {
              removeButton.addEventListener("click", async (event) => {
                event.preventDefault();

                try {
                  const removeResponse = await fetch("/friends/remove", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ friendId }),
                  });

                  if (removeResponse.ok) {
                    alert("Friend removed successfully!");
                    newFriendRequest.remove(); // Remove the friend entry from the DOM
                  } else {
                    alert("Error removing friend.");
                  }
                } catch (error) {
                  console.error("Error:", error);
                  alert("An error occurred while removing the friend.");
                }
              });
            }
          }
        } else {
          alert("Error sending friend request: " + result.error);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while sending the friend request.");
      }
    });
  }

  const acceptButtons = document.querySelectorAll(".approve-friend");
  acceptButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();

      const friendId = button.getAttribute("data-id");
      try {
        const response = await fetch("/friends/accept", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ friendId }),
        });

        const result = await response.json();

        if (response.ok) {
          location.reload(); // Reload the page to update the friends list
        } else {
          alert("Error accepting friend request: " + result.error);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while accepting the friend request.");
      }
    });
  });

  const rejectButtons = document.querySelectorAll(".reject-friend");
  rejectButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();

      const friendId = button.getAttribute("data-id");
      console.log("Friend ID to reject:", friendId); // Debugging line
      try {
        const response = await fetch("/friends/reject", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ friendId }),
        });

        const result = await response.json();

        if (response.ok) {
          location.reload(); // Reload the page to update the friends list
        } else {
          alert("Error rejecting friend request: " + result.error);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while rejecting the friend request.");
      }
    });
  });

  const removeFriendsButtons = document.querySelectorAll(".remove-friend");
  removeFriendsButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();

      const friendId = button.getAttribute("data-id");
      console.log("Friend ID to remove:", friendId); // Debugging line

      try {
        const response = await fetch("/friends/remove", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ friendId }),
        });

        const result = await response.json();

        if (response.ok) {
          location.reload(); // Reload the page to update the friends list
        } else {
          alert("Error removing friend: " + result.error);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while removing the friend.");
      }
    });
  });
});
