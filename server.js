const mysql = require("mysql");
const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
const http = require("http").createServer(app);
const cors = require("cors");
const { signup, login } = require("./controller");

const PORT = process.env.PORT || 3000;

/* 
  Helper methods
*/
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Create MySQL connection
const connection = mysql.createConnection({
  host: "localhost", // Your database host
  user: "root", // Your database username
  password: "8090@Hvd", // Your database password
  database: "chat_app", // Your database name
  port: "3306",
});

// Connect to MySQL database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database");

  // Execute query to retrieve user data
  connection.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return;
    }
    console.log("User data retrieved successfully:");
    console.table(results); // Display results in tabular format
  });
});

// HTTP server
http.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + "/public"));

/* 
  Controller methods
*/
async function handleLogin(req, res, next) {
  const { email, password } = req.body;

  // 1. Check if user exists
  if (!email || !password) {
    return res.status(400).json({
      status: "failure",
      data: {
        message: "Please provide all details",
      },
    });
  }

  // 2. Print out the SQL query
  const sqlQuery = "SELECT * FROM users WHERE email = ?";
  console.log("SQL Query:", sqlQuery);

  // 3. Match the credentials
  connection.query(sqlQuery, [email], async (err, results) => {
    if (err) {
      // Handle database error
      console.error("Error querying database:", err);
      return res.status(500).json({
        status: "failure",
        data: {
          message: "Internal server error",
        },
      });
    }

    if (results.length === 0) {
      // User not found
      return res.status(404).json({
        status: "failure",
        data: {
          message: "User not found",
        },
      });
    }

    const user = results[0];
    console.log("User given: ", user);

    // 4. Check if the password matches
    if (user.password !== password) {
      return res.status(401).json({
        status: "failure",
        data: {
          message: "Incorrect email or password",
        },
      });
    }

    // 5. Generate JWT token
    const token = signToken(user.id);

    // 6. Respond with token and user data
    res.status(200).json({
      status: "success",
      token,
      data: { user },
    });
  });
}

function handleSignUp(req, res, next) {
  const { name, email, password } = req.body;

  /* 
    Validations and error handling
  */
  if (!name || !email || !password) {
    console.error("Please provide all details");
    return res.status(400).json({
      status: "failure",
      data: {
        message: "Please provide all details",
      },
    });
  }

  if (
    password.length < 8 ||
    !/[!@#$%^&*(),.?":{}|<>]/.test(password) ||
    !/[A-Z]/.test(password)
  ) {
    console.error(
      "Password should be 8 chars long with one special character and one capital letter"
    );
    return res.status(400).json({
      status: "failure",
      data: {
        message:
          "Password should be 8 chars long with one special character and one capital letter",
      },
    });
  }

  // Check if the email already exists
  connection.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (err, results) => {
      if (err) {
        console.error("Error querying database:", err);
        return res.status(500).json({
          status: "failure",
          data: {
            message: "Internal server error",
          },
        });
      }

      if (results.length > 0) {
        // Email already exists
        return res.status(400).json({
          status: "failure",
          data: {
            message: "Email already exists",
          },
        });
      }

      // Insert new user into the database
      connection.query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, password],
        (insertErr, insertResult) => {
          if (insertErr) {
            console.error("Error inserting user into database:", insertErr);
            return res.status(500).json({
              status: "failure",
              data: {
                message: "Internal server error",
              },
            });
          }

          // User created successfully
          const newUser = {
            name,
            email,
            password,
            passwordChangedAt: Date.now(),
          };

          // Generate JWT token
          const token = signToken(insertResult.insertId);

          // Respond with success message, token, and user data
          res.status(201).json({
            status: "success",
            token,
            data: { user: newUser },
          });
        }
      );
    }
  );
}

function getMessagesByUserId(req, res, next) {
  const { userId } = req.query; // Retrieve userId from query parameters

  // Check if userId is provided
  if (!userId) {
    console.error("Please provide a user ID");
    return res.status(400).json({
      status: "failure",
      data: {
        message: "Please provide a user ID",
      },
    });
  }

  // Query the database to retrieve messages
  connection.query(
    "SELECT id, message, created_at FROM messages WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, results) => {
      if (err) {
        console.error("Error querying database:", err);
        return res.status(500).json({
          status: "failure",
          data: {
            message: "Internal server error",
          },
        });
      }

      // Respond with the messages
      res.status(200).json({
        status: "success",
        data: {
          messages: results,
        },
      });
    }
  );
}

function saveMessage(req, res, next) {
  const { userId, message } = req.body;

  // Check if userId and message are provided
  if (!userId || !message) {
    console.error("Please provide both user ID and message");
    return res.status(400).json({
      status: "failure",
      data: {
        message: "Please provide both user ID and message",
      },
    });
  }

  // Insert the message into the database
  connection.query(
    "INSERT INTO messages (user_id, message) VALUES (?, ?)",
    [userId, message],
    (err, result) => {
      if (err) {
        console.error("Error inserting message into database:", err);
        return res.status(500).json({
          status: "failure",
          data: {
            message: "Internal server error",
          },
        });
      }

      // Respond with success message
      res.status(201).json({
        status: "success",
        data: {
          message: "Message saved successfully",
          messageId: result.insertId,
        },
      });
    }
  );
}

// Routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/chat", (req, res) => {
  res.sendFile(__dirname + "/chat.html");
});

app.post("/signup", handleSignUp);
app.post("/login", handleLogin);
app.get("/chats", getMessagesByUserId);
app.post("/chats", saveMessage);

// Socket
const io = require("socket.io")(http);

io.on("connection", (socket) => {
  console.log("Connected...");
  socket.on("message", (msg) => {
    socket.broadcast.emit("message", msg);
  });
});
