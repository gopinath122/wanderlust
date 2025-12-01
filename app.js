if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");

const { listingSchema, reviewSchema } = require("./schema.js");

const Review = require("./models/review.js");
const Listing = require("./models/listing.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

// --- DATABASE CONNECTION ---
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
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.use(methodOverride("_method"));

app.engine("ejs", ejsMate);

// --- SESSION & FLASH CONFIGURATION ---
const store = MongoStore.create({
  mongoUrl: dburl,
  collectionName: "sessions",
  ttl: 7 * 24 * 60 * 60,
  autoRemove: "native",
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("❌ ERROR IN MONGO SESSION STORE", err);
});

// ✅ CRITICAL FIX #1: Trust proxy for Render deployment
app.set("trust proxy", 1);

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

app.use(flash());

// --- AUTHENTICATION INITIALIZATION ---
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// --- GLOBAL LOCALS MIDDLEWARE ---
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// // ✅ DEBUG ROUTES - Remove these after fixing the issue
// app.get("/debug-users", async (req, res) => {
//   try {
//     // const users = await User.find({});
//     const users = await User.find({}).select("+hash +salt");
//     res.json({
//       count: users.length,
//       users: users.map((u) => ({
//         id: u._id,
//         username: u.username,
//         email: u.email,
//         hasHash: u.hash ? true : false,
//         hasSalt: u.salt ? true : false,
//         hashType: typeof u.hash,
//         saltType: typeof u.salt,
//         hashLength: u.hash ? u.hash.length : 0,
//         saltLength: u.salt ? u.salt.length : 0,
//       })),
//     });
//   } catch (e) {
//     res.json({ error: e.message });
//   }
// });
// app.get("/debug-schema", (req, res) => {
//   const userFields = Object.keys(User.schema.paths);
//   res.json({
//     fields: userFields,
//     hasHashField: userFields.includes("hash"),
//     hasSaltField: userFields.includes("salt"),
//     hasUsernameField: userFields.includes("username"),
//   });
// });
// app.get("/debug-env", (req, res) => {
//   res.json({
//     NODE_ENV: process.env.NODE_ENV,
//     isProduction: process.env.NODE_ENV === "production",
//   });
// });
// // ✅ FIX #2: Delete all users without passwords (TEMPORARY ROUTE)
// app.get("/fix-users", async (req, res) => {
//   try {
//     // Just delete ALL users since they all have no passwords
//     const result = await User.deleteMany({});

//     res.json({
//       message: "✅ Deleted ALL users (they had no passwords anyway)",
//       deletedCount: result.deletedCount,
//       instructions: "Now go to /signup and create a NEW account!",
//     });
//   } catch (e) {
//     res.json({ error: e.message });
//   }
// });
// --- ROUTE MOUNTING ---
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.get("/", (req, res) => {
  res.redirect("/listings");
});

// --- ERROR HANDLING ---
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!!"));
});

app.use((err, req, res, next) => {
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
