const User = require("../models/user.js");

// --- RENDER SIGNUP FORM ---
module.exports.renderSignUpForm = (req, res) => {
  res.render("users/signup.ejs");
};

// --- SIGNUP LOGIC ---
module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    if (!password || password.length < 6) {
      req.flash("error", "Password must be at least 6 characters");
      return res.redirect("/signup");
    }

    let newUser = new User({
      username: username,
      email: email,
    });

    let registerUser = await User.register(newUser, password);
    console.log("✅ User registered:", registerUser.username);
    console.log("Hash exists:", !!registerUser.hash);
    console.log("Salt exists:", !!registerUser.salt);

    req.login(registerUser, (err) => {
      if (err) {
        console.error("❌ req.login error:", err);
        return next(err);
      }
      // console.log("✅ req.login successful");
      // console.log("✅ Session after login:", req.session);
      // console.log("✅ req.user:", req.user);

      req.flash("success", "Welcome to WanderLust");

      req.session.save((err) => {
        if (err) {
          console.error("❌ Session save error:", err);
          return next(err);
        }
        console.log("✅ Session saved, redirecting to /listings");
        return res.redirect("/listings");
      });
    });
  } catch (e) {
    console.error("❌ Signup error:", e.message);
    req.flash("error", e.message);

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
  console.log("🔐 Login controller called");
  console.log("🔐 req.user:", req.user);
  console.log("🔐 req.isAuthenticated():", req.isAuthenticated());
  console.log("🔐 Session ID:", req.sessionID);
  console.log("🔐 Session:", req.session);

  req.flash("success", "Welcome Back to WanderLust");
  let redirectUrl = res.locals.redirectUrl || "/listings";

  console.log("🔐 Redirect URL:", redirectUrl);

  req.session.save((err) => {
    if (err) {
      console.error("❌ Session save error:", err);
      return next(err);
    }
    console.log("✅ Session saved, redirecting to:", redirectUrl);
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

    req.session.save((err) => {
      if (err) {
        return next(err);
      }
      return res.redirect("/listings");
    });
  });
};
