console.log("Auth service running");

/* 
  Elements
*/
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginButton = document.getElementById("loginButton");

const signupName = document.getElementById("signupName");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const signupButton = document.getElementById("signupButton");

loginButton.addEventListener("click", function () {
  const userObj = {
    email: loginEmail.value,
    password: loginPassword.value,
  };

  fetch("http://localhost:8000/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userObj),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      alert("Logged in successfully");
      console.log("Success:", data);
      // Check if the status is success
      if (data.status === "success") {
        localStorage.setItem("AuthData", JSON.stringify(data.data.user));

        // Redirect to the chat page
        window.location.href = "/chat";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});

signupButton.addEventListener("click", function () {
  const newUser = {
    name: signupName.value,
    email: signupEmail.value,
    password: signupPassword.value,
  };

  fetch("http://localhost:8000/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newUser),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Success:", data);
      // Check if the status is success
      if (data.status === "success") {
        localStorage.clear();

        localStorage.setItem("AuthData", JSON.stringify(data.data.user));

        // Redirect to the chat page
        window.location.href = "/chat";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});
