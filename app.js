if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate"); // Layout engine for EJS (helps with boilerplate)
const wrapAsync = require("./utils/wrapAsync.js"); // Custom wrapper to catch async errors
const ExpressError = require("./utils/ExpressError.js"); // Custom Error class for cleaner error messages

// Import Joi Schemas for server-side validation
const { listingSchema, reviewSchema } = require("./schema.js");

// Import Mongoose Models
const Review = require("./models/review.js");
const Listing = require("./models/listing.js");

// Import Routes (MVC Architecture)
// These files contain the routes for specific features to keep app.js clean
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// Import Authentication & Session Modules
const session = require("express-session"); // Manages user sessions (cookies)
const MongoStore = require("connect-mongo");
const flash = require("connect-flash"); // Displays one-time messages (like "Login Successful")
const passport = require("passport"); // The core authentication library
const LocalStrategy = require("passport-local"); // The strategy for username/password login
const User = require("./models/user.js"); // The User model (configured with passport-local-mongoose)

// --- DATABASE CONNECTION ---
// We use an async function to connect to MongoDB.
// This is the starting point of our data layer.
// const dbUrl = process.env.ATLASDB_URL;
const dburl = process.env.ATLASDB_URL;
async function main() {
  await mongoose.connect(dburl);
}
main()
  .then((res) => {
    console.log("connection successful");
  })
  .catch((err) => {
    console.log(err);
  });

const app = express();

// --- APP CONFIGURATION & MIDDLEWARE ---
// Setup EJS and Views folder
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Parsing Middleware
app.use(express.urlencoded({ extended: true })); // Parses form data (req.body)
app.use(express.json()); // Parses JSON data (for API clients like Hoppscotch)

// Static Files
app.use(express.static(path.join(__dirname, "public"))); // Serves CSS, JS, Images

// Method Override
// Allows us to use PUT and DELETE requests from HTML forms (which only support GET/POST natively)
app.use(methodOverride("_method"));

// EJS Mate
// Enables layouts/boilerplate functionality (blocks, partials)
app.engine("ejs", ejsMate);

// --- SESSION & FLASH CONFIGURATION ---
// This creates the session object and stores it in a cookie in the browser.
const store = MongoStore.create({
  mongoUrl: dburl,
  collectionName: "sessions",
  ttl: 7 * 24 * 60 * 60, // 7 days in seconds
  autoRemove: "native",
  touchAfter: 24 * 3600,
  // ✅ Don't use crypto in v4.6.0
});

store.on("error", (err) => {
  console.log("❌ ERROR IN MONGO SESSION STORE", err);
});

const sessionOptions = {
  store: store,
  secret: process.env.SECRET || "mysecretcode",
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  },
};
app.use(session(sessionOptions));

app.use(flash()); // Must be used AFTER session middleware

// --- AUTHENTICATION INITIALIZATION ---
// These lines must come AFTER session middleware because login state is stored in the session.
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport to use our User model and the LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// How to store/retrieve user data from the session
passport.serializeUser(User.serializeUser()); // Store user ID in session
passport.deserializeUser(User.deserializeUser()); // Fetch full user details from ID

// --- GLOBAL LOCALS MIDDLEWARE ---
// This middleware runs for EVERY request.
// It puts flash messages and the current user info into 'res.locals'.
// This makes 'success', 'error', and 'curruser' automatically available in ALL EJS templates.
app.use((req, res, next) => {
  // console.log("🔍 Request URL:", req.url);
  // console.log("🔍 currUser:", req.user);
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user; // req.user is populated by Passport if logged in
  next();
});

// --- ROUTE MOUNTING ---
// We tell Express to use our imported route files.
// This keeps app.js clean and follows MVC principles.
app.use("/listings", listingRouter); // All routes starting with /listings go here
app.use("/listings/:id/reviews", reviewRouter); // All review routes go here (Child Route)
app.use("/", userRouter); // User routes (signup/login) go to root

app.get("/", (req, res) => {
  res.redirect("/listings");
});
// --- ERROR HANDLING ---

// 404 Handler (Catch-All)
// If a request matches NONE of the routes above, this runs.
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!!"));
});

// Main Error Handler Middleware
// This catches any error thrown by 'next(err)' or 'throw new Error' anywhere in the app.
// Main Error Handler Middleware
app.use((err, req, res, next) => {
  // ✅ CRITICAL: Check if headers were already sent
  if (res.headersSent) {
    console.error("Headers already sent, delegating to default handler:", err);
    return next(err);
  }

  let { status = 500, message = "something went wrong" } = err;
  console.error("Error Handler:", err);
  res.status(status).render("error.ejs", { err });
});
// Start Server
app.listen(8080, (req, res) => {
  console.log("app is listening on 8080 port");
});
