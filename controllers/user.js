const User = require("../models/user.js");

// --- RENDER SIGNUP FORM ---
module.exports.renderSignUpForm = (req, res) => {
  res.render("users/signup.ejs");
};

// --- SIGNUP LOGIC ---
module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;

    let newUser = new User({
      username: username,
      email: email,
    });

    let registerUser = await User.register(newUser, password);

    req.login(registerUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to WanderLust");

      // Wait for session to save before redirecting
      req.session.save((err) => {
        if (err) {
          return next(err);
        }
        return res.redirect("/listings");
      });
    });
  } catch (e) {
    req.flash("error", e.message);

    // Wait for flash message to save before redirecting
    req.session.save((err) => {
      if (err) {
        return next(err);
      }
      return res.redirect("/signup");
    });
  }
};

// --- RENDER LOGIN FORM ---
module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

// --- LOGIN LOGIC ---
module.exports.login = async (req, res, next) => {
  req.flash("success", "Welcome Back to WanderLust");
  let redirectUrl = res.locals.redirectUrl || "/listings";

  // Wait for session to save before redirecting
  req.session.save((err) => {
    if (err) {
      return next(err);
    }
    return res.redirect(redirectUrl);
  });
};

// --- LOGOUT LOGIC ---
module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You are successfully logged out");

    // Wait for session to save before redirecting
    req.session.save((err) => {
      if (err) {
        return next(err);
      }
      return res.redirect("/listings");
    });
  });
};
