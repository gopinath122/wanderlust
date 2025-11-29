const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");

// --- AUTHENTICATION MIDDLEWARE ---
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be logged in to create listings!");

    // Wait for session to save before redirecting
    req.session.save((err) => {
      if (err) {
        return next(err);
      }
      return res.redirect("/login");
    });
    return;
  }
  next();
};

// --- REDIRECT URL SAVER ---
module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

// --- LISTING AUTHORIZATION MIDDLEWARE ---
module.exports.isowner = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found");

    // Wait for session to save before redirecting
    req.session.save((err) => {
      if (err) {
        return next(err);
      }
      return res.redirect("/listings");
    });
    return;
  }

  if (!listing.owner._id.equals(req.user._id)) {
    req.flash("error", "You are not the owner of this listing");

    // Wait for session to save before redirecting
    req.session.save((err) => {
      if (err) {
        return next(err);
      }
      return res.redirect(`/listings/${id}`);
    });
    return;
  }

  next();
};

// --- REVIEW AUTHORIZATION MIDDLEWARE ---
module.exports.isReviewAuthor = async (req, res, next) => {
  let { id, reviewId } = req.params;
  let review = await Review.findById(reviewId);

  if (!review) {
    req.flash("error", "Review not found");

    // Wait for session to save before redirecting
    req.session.save((err) => {
      if (err) {
        return next(err);
      }
      return res.redirect(`/listings/${id}`);
    });
    return;
  }

  if (!review.author._id.equals(req.user._id)) {
    req.flash("error", "You are not the author of this review");

    // Wait for session to save before redirecting
    req.session.save((err) => {
      if (err) {
        return next(err);
      }
      return res.redirect(`/listings/${id}`);
    });
    return;
  }

  next();
};

// --- LISTING VALIDATION MIDDLEWARE ---
module.exports.validatelisting = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);

  if (error) {
    let errmsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errmsg);
  }

  next();
};

// --- REVIEW VALIDATION MIDDLEWARE ---
module.exports.validatereview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);

  if (error) {
    let errmsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errmsg);
  }

  next();
};
