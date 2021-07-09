const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

let db = null;

const dbPath = path.join(__dirname, "userData.db");

//Initialize DB

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server is up and running on port 3000")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//Post/register user

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  //console.log(request.body.username);

  const hashedPassword = await bcrypt.hash(password, 10);
  const checkUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(checkUserQuery);

  if (dbUser === undefined) {
    const postUserQuery = `
    INSERT INTO 
        user (username, name, password, gender, location)
    VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}')`;

    if (password.length > 4) {
      await db.run(postUserQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//Login user

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  //console.log(request.body);
  const checkUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(checkUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//password change

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(checkUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === true) {
      if (newPassword.length > 5) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
            UPDATE 
                user 
             SET 
                password = '${hashedPassword}' 
            WHERE 
                username = '${username}'`;

        const user = await db.run(updatePasswordQuery);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
