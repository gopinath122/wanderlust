const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/user.js");

// --- SIGNUP ROUTES ---

// GET /signup
// Renders the signup form where users enter username, email, and password.
router.get("/signup", userController.renderSignUpForm);

// POST /signup
// Handles the actual registration logic.
// The controller will:
// 1. Create a new User instance.
// 2. Use User.register() to hash the password and save to DB.
// 3. Automatically login the user after signup.
router.post("/signup", userController.signup);

// --- LOGIN ROUTES ---

// POST /login
// This route is special because it uses multiple middleware functions in a specific order.
router.post(
  "/login",

  // 1. saveRedirectUrl:
  // This custom middleware saves the URL the user was trying to visit (e.g., /listings/new)
  // so we can redirect them back there after they successfully login.
  saveRedirectUrl,

  // 2. passport.authenticate("local"):
  // This is the "Security Guard". It automatically checks the username and password against the DB.
  // - failureRedirect: If login fails, immediately go back to "/login".
  // - failureFlash: Automatically flash a "Username/Password incorrect" message on failure.
  // If authentication SUCCEEDS, it calls the next function (userController.login).
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),

  // 3. userController.login:
  // This only runs if the password was correct.
  // It handles the final "Welcome back!" flash message and the actual redirect.
  userController.login
);

// GET /login
// Renders the login form.
router.get("/login", userController.renderLoginForm);

// --- LOGOUT ROUTE ---

// GET /logout
// Calls req.logout() (provided by Passport) to destroy the session and clear the cookie.
router.get("/logout", userController.logout);

module.exports = router;

// Key Takeaways from routes/user.js:
// 1.passport.authenticate is Middleware: Notice how we pass it inside the route definition. It acts as a gatekeeper. If the password is wrong, the code stops there and redirects.
// The controller function (userController.login) never even runs.

// 2.saveRedirectUrl: This must run before passport authenticates. If we logged in first, Passport might reset the session, and we'd lose the "return address" we wanted to save.
