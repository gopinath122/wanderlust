const Listing = require("../models/listing");
const Review = require("../models/review");

// --- CREATE REVIEW CONTROLLER (FIXED) ---
module.exports.createReview = async (req, res, next) => {
  // ✅ Added 'next'
  try {
    // 1. Find the parent Listing by ID
    let newlisting = await Listing.findById(req.params.id);

    // 2. Create the new Review object
    let newreview = new Review(req.body.review);

    // 3. Assign the Author
    newreview.author = req.user._id;

    // console.log(newreview);

    // 4. Push the new review into the listing's reviews array
    newlisting.reviews.push(newreview);

    // 5. Save BOTH documents to the database
    await newreview.save();
    await newlisting.save();

    // 6. Flash & Redirect (FIXED)
    req.flash("success", "New Review Created!");

    // ✅ CRITICAL: Wait for session save before redirect
    req.session.save((err) => {
      if (err) return next(err); // ✅ Use next(err) instead of console.error
      return res.redirect(`/listings/${newlisting._id}`); // ✅ Correct syntax with ()
    });
  } catch (err) {
    console.error("❌ Error creating review:", err);
    next(err); // ✅ Simplified - just pass error to Express
  }
};

// --- DELETE REVIEW CONTROLLER (FIXED) ---
module.exports.deleteReview = async (req, res, next) => {
  // ✅ Added 'next'
  try {
    let { id, reviewId } = req.params;

    // 1. Remove the Review ID from the Listing's reviews array
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

    // 2. Delete the actual Review document
    await Review.findByIdAndDelete(reviewId);

    // 3. Flash & Redirect (FIXED)
    req.flash("success", "Review Deleted");

    // ✅ CRITICAL: Wait for session save before redirect
    req.session.save((err) => {
      if (err) return next(err); // ✅ Use next(err)
      return res.redirect(`/listings/${id}`); // ✅ Correct syntax with ()
    });
  } catch (err) {
    console.error("❌ Error deleting review:", err);
    next(err); // ✅ Simplified - just pass error to Express
  }
};
