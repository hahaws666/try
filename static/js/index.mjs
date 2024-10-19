import { getItems, getUserItem, addItemWithImage, getUserrs, deleteItem, getCurrentUser } from "./api.mjs";

let page = 0; // Current page
let userItems = []; // Store all user items
let inspecting = null;

function onError(err) {
  console.error("[error]", err);
  const error_box = document.querySelector("#error_box");
  error_box.innerHTML = err.message;
  error_box.style.visibility = "visible";
}

const username = getCurrentUser();
if (username) {
  document.querySelector("#signout").classList.remove("hidden");
  document.querySelector("#users").classList.remove("hidden");
  document.querySelector("#items").classList.remove("hidden");
  document.querySelector("#user_item").classList.remove("hidden");
} else {
  document.querySelector("#signin").classList.remove("hidden");
  document.querySelector("#signup").classList.remove("hidden");
}

  function update() {
    // Fetch the list of users
    getUserrs(onError, function (users) {
      document.querySelector("#users").innerHTML = ""; // Clear the existing users list
  
      users.forEach(function (user) {
        let element = document.createElement("div");
        element.innerHTML = `
          <button class="user_content" data-user-id="${user._id}">${user._id}</button>
        `;
        document.querySelector("#users").prepend(element);
      });
    });
  
    if (inspecting != null) {
      getUserItem(inspecting, function (items) {
        if (inspecting === username) {
          document.querySelector("#add_item").classList.remove("hidden");
        } else {
          document.querySelector("#add_item").classList.add("hidden");
        }
        userItems = items; // Store fetched items
        page = 0; // Reset page index when new user is selected
        displayPage(); // Display the first page
      }, onError);
    }
  }
  
  // Function to display the current page (one item at a time)
  function displayPage() {
    // Ensure page is within valid range
    if (page < 0) page = 0;
    if (page >= userItems.length) page = userItems.length - 1;
  
    // Clear existing items
    document.querySelector("#user_item").innerHTML = "";
  
    // Display the current item
    if (userItems.length > 0) {
      const item = userItems[page]; // Get current item based on page index
  
      let element = document.createElement("div");
      element.className = "item";
  
      // Add content
      element.innerHTML = `<div class="item_content">${item.content}</div>`;
  
      // If the item has an image, display it
      if (item.imageUrl) {
        element.innerHTML += `
          <div class="item_image">
            <img src="${item.imageUrl}" alt="To-Do image" style="max-width: 200px; margin-top: 10px;" />
          </div>
        `;
      }
  
      // If the item belongs to the logged-in user, add a delete option
      if (item.owner === username) {
        element.innerHTML += `<div class="delete-icon icon"></div>`;
        element.querySelector(".delete-icon").addEventListener("click", function () {
          deleteItem(item._id, onError, update);
        });
      }
  
      // Prepend the new item element to the user_item container
      document.querySelector("#user_item").prepend(element);
  
      // Update pagination controls visibility
      document.querySelector("#prev").style.visibility = page === 0 ? "hidden" : "visible";
      document.querySelector("#next").style.visibility = page === userItems.length - 1 ? "hidden" : "visible";
    } else {
      document.querySelector("#user_item").innerHTML = "<p>No items found</p>";
      document.querySelector("#prev").style.visibility = "hidden";
      document.querySelector("#next").style.visibility = "hidden";
    }
  }

document.querySelector("#prev").addEventListener("click", function (e) {
  e.preventDefault();
  if (page > 0) {
    page--; // Go to the previous page
    displayPage(); // Display the updated page
  }
});

document.querySelector("#next").addEventListener("click", function (e) {
  e.preventDefault();
  if (page < userItems.length - 1) {
    page++; // Go to the next page
    displayPage(); // Display the updated page
  }
});

document.querySelector("#add_item").addEventListener("submit", function (e) {
  e.preventDefault();

  let content = document.querySelector("#content_form").value;
  let image = document.querySelector("#image_form").files[0]; // Get the selected image file
  
  document.querySelector("#add_item").reset();

  // Use the addItemWithImage function from api.mjs
  addItemWithImage(content, image, onError, function () {
    page = 0;
    update(); // Refresh the list
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelector("#users").addEventListener("click", function (e) {
    if (e.target && e.target.matches("button.user_content")) {
      e.preventDefault();
      const userId = e.target.textContent; // Get the user's id from the button text
      inspecting = userId;

      getUserItem(userId, function (items) {
        userItems = items;
        page = 0; // Reset to the first page
        displayPage(); // Display the first item
      }, onError);
      update();
    }
  });
});

(function refresh() {
  update();
  setTimeout(refresh, 5000);
})();
