import { getItems, getUserItem, addItemWithImage, getUserrs, deleteItem, getCurrentUser } from "./api.mjs";

let page = 0;
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
    getUserItem(inspecting, function (userItems) {
      // Show the add item form only if the logged-in user is viewing their own items
      if (inspecting === username) {
        document.querySelector("#add_item").classList.remove("hidden");
      } else {
        document.querySelector("#add_item").classList.add("hidden");
      }
  
      // Clear existing items before displaying new ones
      document.querySelector("#user_item").innerHTML = "";
  
      // Loop through and display each item
      userItems.forEach(item => {
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
      });
    }, onError);
  }
  
}

document.querySelector("#prev").addEventListener("click", function (e) {
  e.preventDefault();
  page = Math.max(0, page - 1);
  update();
});

document.querySelector("#next").addEventListener("click", function (e) {
  e.preventDefault();
  page = page + 1;
  update();
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

      getUserItem(userId, function (userItems) {
        if (userId === username) {
          document.querySelector("#add_item").classList.remove("hidden");
        } else {
          document.querySelector("#add_item").classList.add("hidden");
        }

        document.querySelector("#user_item").innerHTML = ""; // Clear existing items

        userItems.forEach(item => {
          let element = document.createElement("div");
          element.className = "item";
          element.innerHTML = `<div class="item_content">${item.content}</div>`;

          if (item.owner === username) {
            element.innerHTML += `<div class="delete-icon icon"></div>`;
            element.querySelector(".delete-icon").addEventListener("click", function () {
              deleteItem(item._id, onError, update);
            });
          }

          document.querySelector("#user_item").prepend(element);
        });
      }, onError);
    }
  });
});

(function refresh() {
  update();
  setTimeout(refresh, 5000);
})();
