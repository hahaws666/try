import { getUserItem, addItemWithImage, getUserrs, deleteItem, getCurrentUser, addComment, deleteComment } from "./api.mjs";

let page = 0; // Current page for items
let commentPage = 0; // Current page for comments
let userItems = []; // Store all user items
let inspecting = null;
const commentsPerPage = 10; // Number of comments to display per page

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
  document.querySelector("#comments").innerHTML = "";

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

    // Now, we are adding the comments with pagination
    let commentElement = document.createElement("div");
    commentElement.className = "commentelement";

    // Pagination for comments
    const totalComments = item.comments ? item.comments.filter(comment => comment.deleted == 0).length : 0;
    const totalPages = Math.ceil(totalComments / commentsPerPage);
    const visibleComments = item.comments
      ? item.comments.filter(comment => comment.deleted == 0).slice(commentPage * commentsPerPage, (commentPage + 1) * commentsPerPage)
      : [];

    if (visibleComments.length > 0) {
      visibleComments.forEach(comment => {
        // 为每个评论创建单独的 div 容器
        let commentDiv = document.createElement("div");
        commentDiv.className = "comment";
        commentDiv.innerHTML = `<p>${comment.content} - by ${comment.owner}</p>`;

        if (username == item.owner || username == comment.owner) {
          commentDiv.innerHTML += `<div type="button" class="icon deletecomment" data-item-id="${item._id}" data-comment-id="${comment._id}">delete</div>`;
        }

        commentElement.appendChild(commentDiv);
      });

      document.querySelector("#comment-paginations").innerHTML ="";
      // Add pagination buttons for comments
      let paginationDiv = document.createElement("div");
      paginationDiv.className = "comment-pagination";
      if (commentPage > 0) {
        let prevCommentBtn = document.createElement("button");
        prevCommentBtn.textContent = "Previous Comments";
        prevCommentBtn.className ="prevcomment";
        paginationDiv.appendChild(prevCommentBtn);
      }
      if (commentPage < totalPages - 1) {
        let nextCommentBtn = document.createElement("button");
        nextCommentBtn.textContent = "Next Comments";
        nextCommentBtn.className="nextcomment";
        paginationDiv.appendChild(nextCommentBtn);
      }
      document.querySelector("#comment-paginations").appendChild(paginationDiv);

      // 将 commentElement 追加到 #comments 容器中
      document.querySelector("#comments").prepend(commentElement);
    } else {
      commentElement.innerHTML = "<p>No comments yet.</p>";
      document.querySelector("#comments").prepend(commentElement);
    }

    // Add the form for adding new comments
    document.querySelector("#comments").innerHTML += `
      <form id="add_comment">
        <input type="text" id="comment_input" placeholder="Add a comment..." required />
        <button type="submit" class="commentsubmit">Submit</button>
      </form>
    `;
    
    document.querySelector("#comments").addEventListener("click", function (e) {
      if (e.target && e.target.classList.contains("deletecomment")) {
        const itemId = e.target.getAttribute("data-item-id");
        const commentId = e.target.getAttribute("data-comment-id");

        console.log("deleting comment ID:", commentId, "item ID:", itemId);

        // 调用 API 删除评论，传递 itemId 和 commentId
        deleteComment(itemId, commentId, onError, function () {
          console.log("comment deleted success");
          update(); // 删除成功后更新页面
        });
      }
    });

    document.querySelector("#comment-paginations").addEventListener("click",function(e){
      if(e.target && e.target.classList.contains("prevcomment")){
        commentPage --;
        displayPage();
      }
      if (e.target && e.target.classList.contains("nextcomment")) {
        commentPage ++;
        displayPage();
      }
    })

    // Handle comment submission
    document.querySelector("#add_comment").addEventListener("submit", function (e) {
      e.preventDefault();
      const commentContent = document.querySelector("#comment_input").value;
      addComment(item._id, commentContent, onError, update); // Call API to add comment
    });

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
    commentPage =0;
    displayPage(); // Display the updated page
  }
});

document.querySelector("#next").addEventListener("click", function (e) {
  e.preventDefault();
  if (page < userItems.length - 1) {
    page++; // Go to the next page
    commentPage=0;
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
    commentPage =0;
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
    }
    update();
  });
});

(function refresh() {
  update();
  setTimeout(refresh, 50000);
})();
