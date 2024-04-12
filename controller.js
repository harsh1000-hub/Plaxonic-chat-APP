const jwt = require("jsonwebtoken");
const { connection } = require("./server");

require("dotenv").config({
  path: ".env",
});

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = async (req, res, next) => {
  const { name, email, password } = req.body;

  const newUser = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordChangedAt: req.body.passwordChangedAt || Date.now(),
  };

  /* 
    Validations and error handling
  */
  if (!email || !password) {
    console.error("Please provide all details");
    res.status(400).json({
      status: "failure",
      data: {
        message: "Please provide all details",
      },
    });
    return;
  }

  if (
    password?.length < 8 ||
    !/[!@#$%^&*(),.?":{}|<>]/.test(password) ||
    !/[A-Z]/.test(password)
  ) {
    console.error(
      "Password should be 8 chars long with one special character and one capital letter"
    );
    res.status(400).json({
      status: "failure",
      data: {
        message:
          "Password should be 8 chars long with one special character and one capital letter",
      },
    });
    return;
  }

  /* 
   Logic to save data in db
  */
  console.log("connection: ", connection);

  connection.query(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, password],
    (err, result) => {
      if (err) {
        res.status(400).send("Email already exists");
      } else {
        // Redirect user to chat page after successful signup
        res.redirect("/chat");
      }
    }
  );
  /* 
    Token sign and pass to db  
  */
  const token = signToken(newUser._id);

  res.status(201).json({
    status: "success",
    token,
    data: {
      user: newUser,
    },
  });
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  console.log(connection);

  // 1. Check if user exists
  if (!email || !password) {
    return res.status(400).json({
      status: "failure",
      data: {
        message: "Please provide all details",
      },
    });
  }

  // 2. Match the credentials
  connection.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
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

      // 3. Check if the password matches
      if (user.password !== password) {
        return res.status(401).json({
          status: "failure",
          data: {
            message: "Incorrect email or password",
          },
        });
      }

      // 4. Generate JWT token
      const token = signToken(user.id);

      // 5. Respond with token and user data
      res.status(200).json({
        status: "success",
        token,
        data: { user },
      });
    }
  );
};
