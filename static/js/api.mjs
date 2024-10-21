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
  

  export function addComment(itemId, content,fail,success) {
	fetch(`/api/items/${itemId}/comments`, {
	  method: "POST",
	  headers: { "Content-Type": "application/json" },
	  body: JSON.stringify({ content })
	})
	.then(success)
	.catch(fail);
  }
  
  

  export function voteComment(itemId, commentId, action, onError, onSuccess) {
	fetch(`/api/items/${itemId}/comments/${commentId}/vote`, {
	  method: 'PATCH',
	  headers: {
		'Content-Type': 'application/json'
	  },
	  body: JSON.stringify({ action }) // 发送 'up' 或 'down'
	})
	  .then(handleReponse)
	  .then(onSuccess)
	  .catch(onError);
	console.log("lallal");
  }
  

  
  export function deleteComment(itemId, commentId, onError, onSuccess) {
	fetch(`/api/items/${itemId}/comments/${commentId}`, {
	  method: 'PATCH',
	})
	.then(handleReponse)
	.then(onSuccess)
	.catch(onError);

  }
  