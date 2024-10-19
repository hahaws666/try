function handleReponse(res){
	if (res.status != 200) { return res.text().then(text => { throw new Error(`${text} (status: ${res.status})`)}); }
	return res.json();
}

export function addItem(content, fail, success) {
    fetch("/api/items/", {
  		method:  "POST",
  		headers: {"Content-Type": "application/json"},
  		body: JSON.stringify({ content: content }),
    })
	.then(handleReponse)
	.then(success)
	.catch(fail); 
}


// export function addItem(content, imageFile, fail, success) {
// 	const formData = new FormData();
// 	formData.append('content', content);
	
// 	if (imageFile) {
// 	  formData.append('image', imageFile);
// 	}
  
// 	fetch("/api/items/", {
// 	  method: "POST",
// 	  body: formData,
// 	})
// 	  .then(handleReponse)
// 	  .then(success)
// 	  .catch(fail);
//   }
  

export function deleteItem(itemId, fail, success) {
	fetch("/api/items/" + itemId, {
		method:  "DELETE",
	})
	.then(handleReponse)
	.then(success)
	.catch(fail); 
}

export function getUserrs(fail,success){
	fetch(`/api/users/`)
		.then(handleReponse)
		.then(success)
		.catch(fail);
	
}
export function getItems(page, fail, success) {
  fetch(`/api/items/?page=${page}`)
	.then(handleReponse)
	.then(success)
	.catch(fail); 
}

export function getCurrentUser() {
  let username = document.cookie.split("username=")[1];
  if (username.length == 0) return null;
  return username;
}


export function getUserItem(userId, success, fail) {
	fetch(`/todos/${userId}`)
	  .then(response => response.json())
	  .then(success)
	  .catch(fail);
  }
  

  export function addItemWithImage(content, image, fail, success) {
	// Create a FormData object to send text and file data
	let formData = new FormData();
	formData.append("content", content);
	if (image) {
	  formData.append("image", image); // Append the image if it's selected
	}
  
	// Send the form data (content and image) to the server
	fetch("/api/items", {
	  method: "POST",
	  body: formData // Send the form data
	})
	.then(response => response.json())
	.then(success)
	.catch(fail);
  }
  

  export function addComment(itemId, content) {
	fetch(`/api/items/${itemId}/comments`, {
	  method: "POST",
	  headers: { "Content-Type": "application/json" },
	  body: JSON.stringify({ content })
	})
	.then(response => {
	  if (response.ok) {
		update(); // Reload the item to show the new comment
	  } else {
		throw new Error("Failed to add comment");
	  }
	})
	.catch(onError);
  }
  
  export function thumbUpComment(itemId, commentId) {
	fetch(`/api/items/${itemId}/comments/${commentId}/thumbUp`, { method: "POST" })
	  .then(response => {
		if (response.ok) {
		  update(); // Reload the item to show updated likes
		} else {
		  throw new Error("Failed to thumb up comment");
		}
	  })
	  .catch(onError);
  }
  
  export function thumbDownComment(itemId, commentId) {
	fetch(`/api/items/${itemId}/comments/${commentId}/thumbDown`, { method: "POST" })
	  .then(response => {
		if (response.ok) {
		  update(); // Reload the item to show updated dislikes
		} else {
		  throw new Error("Failed to thumb down comment");
		}
	  })
	  .catch(onError);
  }
  
  export function deleteComment(itemId, commentId) {
	fetch(`/api/items/${itemId}/comments/${commentId}`, { method: "DELETE" })
	  .then(response => {
		if (response.ok) {
		  update(); // Reload the item to remove the deleted comment
		} else {
		  throw new Error("Failed to delete comment");
		}
	  })
	  .catch(onError);
  }
  