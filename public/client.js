const socket = io();
let userName = JSON.parse(sessionStorage.getItem("AuthData"))?.name;
let textarea = document.querySelector("#textarea");
let messageArea = document.querySelector(".message__area");
do {
  userName = prompt("Please enter your name: ");
} while (!userName);

textarea.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    sendMessage(e.target.value);
  }
});

function sendMessage(message) {
  let msg = {
    user: userName,
    message: message.trim(),
  };

  // Append
  appendMessage(msg, "outgoing");
  textarea.value = "";
  scrollToBottom();
  socket.emit("message", msg);
  // Send to server
  saveMessageToDatabase(msg); // Call function to save message to the database
}

function saveMessageToDatabase(message) {
  fetch("/chats", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: getUserId(),
      message: message.message,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to save message");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Message saved successfully:", data);
    })
    .catch((error) => {
      console.error("Error saving message:", error);
    });
}

function appendMessage(msg, type) {
  let mainDiv = document.createElement("div");
  let className = type;
  mainDiv.classList.add(className, "message");

  let markup = `
        <h4>${msg.user}</h4>
        <p>${msg.message}</p>
    `;
  mainDiv.innerHTML = markup;
  messageArea.appendChild(mainDiv);
}

// Recieve messages
socket.on("message", (msg) => {
  appendMessage(msg, "incoming");
  scrollToBottom();
});

function scrollToBottom() {
  messageArea.scrollTop = messageArea.scrollHeight;
}

/* 
  UI Code
*/
const userNname = document.getElementById("username");

const userData = JSON.parse(sessionStorage.getItem("AuthData"));

username.innerHTML = userData?.name || "Harsh";
