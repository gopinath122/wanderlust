const joi = require("joi"); // Import the Joi validation library

// --- LISTING SCHEMA ---
// This defines the validation rules for a Listing.
// It ensures that any data sent to create/update a listing matches these rules
// BEFORE we try to save it to the database.
module.exports.listingSchema = joi.object({
  listing: joi
    .object({
      // title: Must be a string and cannot be empty
      title: joi.string().required(),

      // description: Must be a string and cannot be empty
      description: joi.string().required(),

      // location: Must be a string and cannot be empty
      location: joi.string().required(),

      // country: Must be a string and cannot be empty
      country: joi.string().required(),

      // price: Must be a number and cannot be empty.
      // (Note: You should ideally add .min(0) here to prevent negative prices!)
      price: joi.number().required().min(0),

      // image: Must be a string.
      // .allow("", null) means it is optional. If the user sends an empty string or null, it's valid.
      // This allows our Mongoose schema default to kick in later if no image is provided.
      image: joi.string().allow("", null),
      category: joi.string().required(),
    })
    .required(), // The 'listing' object itself is required in req.body
});

// --- REVIEW SCHEMA ---
// This defines the validation rules for a Review.
module.exports.reviewSchema = joi.object({
  review: joi
    .object({
      // rating: Must be a number.
      // .min(1) and .max(5) ensures the rating is between 1 and 5 stars.
      rating: joi.number().required().min(1).max(5),

      // comment: Must be a string and cannot be empty.
      comment: joi.string().required(),
    })
    .required(), // The 'review' object itself is required
});

// 🔑 Key Takeaways from schema.js:
// The "Gatekeeper": These schemas act as the first line of defense. If a request (like from Hoppscotch or a hacker) sends bad data (e.g., price: "hello" or rating: 10), Joi stops it immediately.

// Nested Objects: Notice how we validate req.body.listing and req.body.review. This matches the structure of your HTML forms (name="listing[title]").

// .required(): This is crucial. It ensures that a user cannot submit a form with missing fields, preventing empty/broken data in your database.

// You have now documented your Data Validation Layer.
