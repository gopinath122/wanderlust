const express = require("express");

// --- MERGE PARAMS (CRITICAL) ---
// We set { mergeParams: true } because this router handles routes like:
// /listings/:id/reviews
// The ":id" is actually defined in app.js, NOT in this file.
// By default, this router cannot see parameters defined in the parent router.
// mergeParams: true fixes this so we can access req.params.id here.
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync.js"); // Error handling wrapper
const ExpressError = require("../utils/ExpressError.js"); // Custom error class
const { listingSchema, reviewSchema } = require("../schema.js"); // Joi schemas
const Review = require("../models/review.js"); // Review Model
const Listing = require("../models/listing.js"); // Listing Model

// Import Middleware
// validatereview: Checks if the review data (rating, comment) matches Joi schema rules
// isLoggedIn: Checks if user is signed in before posting
// isReviewAuthor: Checks if the logged-in user is the one who wrote the review (Authorization)
const {
  validatereview,
  isLoggedIn,
  isReviewAuthor,
} = require("../middleware.js");

// Import Controller
// All the heavy logic (saving to DB, deleting from DB) is moved here.
const reviewController = require("../controllers/review.js");

// --- CREATE REVIEW ROUTE ---
// POST /listings/:id/reviews
router.post(
  "/",
  isLoggedIn, // 1. Guard: Must be logged in to write a review
  validatereview, // 2. Guard: Data must be valid (rating 1-5, comment exists)
  wrapAsync(reviewController.createReview) // 3. Logic: Save review and link to Listing
);

// --- DELETE REVIEW ROUTE ---
// DELETE /listings/:id/reviews/:reviewId
router.delete(
  "/:reviewId",
  isLoggedIn, // 1. Guard: Must be logged in
  isReviewAuthor, // 2. Guard: ONLY the author can delete their own review
  wrapAsync(reviewController.deleteReview) // 3. Logic: Remove from Listing array AND Review collection
);

module.exports = router;

// 🔑 Key Takeaways from routes/review.js:
// mergeParams: true: Without this, req.params.id would be undefined inside this file, because the ID part of the URL happened in app.js (app.use("/listings/:id/reviews", reviewRouter)).

// Nested Resources: This file handles the "Many" side of the "One-to-Many" relationship. A review cannot exist without a listing.

// isReviewAuthor: This is crucial for security. It prevents User A from deleting User B's review, even if User A is logged in.
