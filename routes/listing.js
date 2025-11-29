const express = require("express");
// express.Router() creates a modular, mountable route handler.
// It's like a mini-application that handles routes for a specific part of the app.
// Instead of cluttering app.js with all routes, we group them here.
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js"); // Error handling wrapper for async functions
const { validatelisting } = require("../middleware.js"); // Joi validation middleware to secure data
const Listing = require("../models/listing.js"); // The Listing Mongoose model to talk to the DB
const passport = require("passport"); // For checking authentication status

// Custom middleware to protect routes (check login status and ownership)
const { isLoggedIn, isowner } = require("../middleware.js");

// Import the Controller (MVC Pattern)
// The controller contains the actual logic for each route (the "brain").
// This keeps the route file clean and focused only on matching paths to functions.
const ListingController = require("../controllers/listing.js");

// --- MULTER & CLOUDINARY CONFIGURATION ---
// 1. Import Multer to handle file uploads
const multer = require("multer");
// 2. Import the storage engine we configured in cloudConfig.js
const { storage } = require("../cloudConfig.js");
// 3. Initialize Multer with our Cloudinary storage
const upload = multer({ storage });

// --- INDEX & CREATE ROUTES ---
// router.route("/") allows us to chain different HTTP methods (GET, POST)
// that share the same path ("/") together. This is cleaner and more organized.

router
  .route("/")
  // GET /listings - Show all listings
  .get(wrapAsync(ListingController.index))

  // POST /listings - Create a new listing
  // 1. isLoggedIn: Ensures user is logged in before posting
  // 2. validatelisting: Validates the form data using Joi schema
  // 3. ListingController.createListing: The logic to save to DB
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validatelisting,

    wrapAsync(ListingController.createListing)
  );

// --- NEW FORM ROUTE ---
// GET /listings/new - Show the form to create a new listing
// Must come BEFORE the /:id route, otherwise "new" would be treated as an ID!
router.get("/new", isLoggedIn, ListingController.RenderNewForm);

//SEARCHING ROUTE
router.get("/search", wrapAsync(ListingController.searchListing));
// --- SHOW, UPDATE & DELETE ROUTES ---
// router.route("/:id") groups all operations that require a specific listing ID.

router
  .route("/:id")
  // GET /listings/:id - Show details of one specific listing
  .get(wrapAsync(ListingController.showListing))

  // PUT /listings/:id - Update a specific listing
  // 1. isLoggedIn: Must be logged in to edit
  // 2. isowner: Must be the creator of this specific listing to edit it
  // 3. validatelisting: Validate new data before saving
  .put(
    isLoggedIn,
    isowner,
    upload.single("listing[image]"),
    validatelisting,
    wrapAsync(ListingController.updateListing)
  )

  // DELETE /listings/:id - Delete a specific listing
  // 1. isLoggedIn: Must be logged in
  // 2. isowner: Must be the creator
  .delete(isLoggedIn, isowner, wrapAsync(ListingController.deleteListing));

// --- EDIT FORM ROUTE ---
// GET /listings/:id/edit - Show the form to edit an existing listing
router.get("/:id/edit", isLoggedIn, wrapAsync(ListingController.editListing));

module.exports = router;

// ### 🔑 Key Takeaways from `routes/listing.js`:
// 1.  **`router.route()` Chaining:** Instead of writing `router.get("/")` and `router.post("/")` separately, we group them. It makes the code easier to read.
// 2.  **Middleware Order:** Notice the order in `.post()` and `.put()`:
//     * First, `isLoggedIn` (Are you a user?)
//     * Then, `isowner` (Is this *your* listing?)
//     * Then, `validatelisting` (Is the data good?)
//     * Finally, the Controller (Do the work). This is the "Security Guard" chain we talked about.
// 3.  **Controller Logic:** The file is very clean because all the heavy logic (finding data, saving data) is hidden inside `ListingController`. This file is just the "Traffic Cop" directing requests.

//
