const Listing = require("../models/listing");
const NodeGeocoder = require("node-geocoder");

const options = {
  provider: "openstreetmap",
};
const geocoder = NodeGeocoder(options);

// --- INDEX CONTROLLER (FIXED) ---
module.exports.index = async (req, res, next) => {
  try {
    let { category } = req.query;
    let alllistings;

    if (category) {
      alllistings = await Listing.find({ category: category });
    } else {
      alllistings = await Listing.find({});
    }

    if (!alllistings) {
      alllistings = [];
    }

    // console.log("📋 Found listings:", alllistings.length);
    // console.log("📋 About to render...");

    // ✅ FIX: Just render - don't use return
    res.render("listings/index.ejs", { alllistings });
  } catch (err) {
    console.error("❌ Error in index:", err);
    // ✅ Pass error to Express error handler instead of redirecting
    next(err);
  }
};

// --- RENDER NEW FORM CONTROLLER ---
module.exports.RenderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// --- SHOW CONTROLLER (FIXED) ---
module.exports.showListing = async (req, res, next) => {
  try {
    let { id } = req.params;

    let data = await Listing.findById(id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("owner");

    if (!data) {
      req.flash("error", "Listing you requested for does not exist");

      req.session.save((err) => {
        if (err) return next(err);
        return res.redirect("/listings");
      });
      return;
    }

    // console.log(data);
    res.render("listings/show.ejs", { data });
  } catch (err) {
    console.error("❌ Error in showListing:", err);
    next(err);
  }
};

// --- CREATE CONTROLLER (FIXED) ---
module.exports.createListing = async (req, res, next) => {
  try {
    let url = req.file.path;
    let filename = req.file.filename;

    let response = await geocoder.geocode(req.body.listing.location);
    let newlisting = req.body.listing;

    let newdata = new Listing(newlisting);
    newdata.owner = req.user._id;
    newdata.image = { url, filename };
    newdata.geometry = {
      type: "Point",
      coordinates:
        response.length > 0
          ? [response[0].longitude, response[0].latitude]
          : [0, 0],
    };

    await newdata.save();
    // console.log("✅ Saved Listing with Geo:", newdata);

    req.flash("success", "New Listing Created!!");

    req.session.save((err) => {
      if (err) return next(err);
      return res.redirect("/listings");
    });
  } catch (err) {
    console.error("❌ Error creating listing:", err);
    req.flash("error", "Could not create listing");

    req.session.save((saveErr) => {
      if (saveErr) return next(saveErr);
      return res.redirect("/listings/new");
    });
  }
};

// --- SEARCH CONTROLLER (FIXED) ---
module.exports.searchListing = async (req, res, next) => {
  try {
    let { q } = req.query;

    // console.log("User searched for:", q);

    if (!q || q.trim() === "") {
      return res.redirect("/listings");
    }

    let alllistings = await Listing.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { country: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
      ],
    });

    // console.log("Found listings:", alllistings.length);

    if (alllistings.length === 0) {
      req.flash("error", "No listing found for '" + q + "'");

      req.session.save((err) => {
        if (err) return next(err);
        return res.redirect("/listings");
      });
      return;
    }

    res.render("listings/index.ejs", { alllistings });
  } catch (err) {
    console.error("❌ Error in search:", err);
    next(err);
  }
};

// --- RENDER EDIT FORM CONTROLLER (FIXED) ---
module.exports.editListing = async (req, res, next) => {
  try {
    let { id } = req.params;
    let data = await Listing.findById(id);

    if (!data) {
      req.flash("error", "Listing you requested for does not exist");

      req.session.save((err) => {
        if (err) return next(err);
        return res.redirect("/listings");
      });
      return;
    }

    let originalurl = data.image.url;
    if (originalurl && originalurl.includes("/upload")) {
      originalurl = originalurl.replace("/upload", "/upload/h_200,w_250");
    }

    // console.log("after", originalurl);
    res.render("listings/edit.ejs", { data, originalurl });
  } catch (err) {
    console.error("❌ Error in editListing:", err);
    next(err);
  }
};

// --- UPDATE CONTROLLER (FIXED) ---
module.exports.updateListing = async (req, res, next) => {
  try {
    let { id } = req.params;

    let response = await geocoder.geocode(req.body.listing.location);

    let listing = await Listing.findByIdAndUpdate(id, {
      ...req.body.listing,
    });

    if (!listing) {
      req.flash("error", "Listing not found");

      req.session.save((err) => {
        if (err) return next(err);
        return res.redirect("/listings");
      });
      return;
    }

    listing.geometry = {
      type: "Point",
      coordinates:
        response.length > 0
          ? [response[0].longitude, response[0].latitude]
          : [0, 0],
    };
    await listing.save();

    if (typeof req.file != "undefined") {
      let url = req.file.path;
      let filename = req.file.filename;
      listing.image = { url, filename };
      await listing.save();
    }

    req.flash("success", "Update Successfully");

    req.session.save((err) => {
      if (err) return next(err);
      return res.redirect(`/listings/${id}`);
    });
  } catch (err) {
    console.error("❌ Error updating listing:", err);
    req.flash("error", "Could not update listing");

    req.session.save((saveErr) => {
      if (saveErr) return next(saveErr);
      return res.redirect("/listings");
    });
  }
};

// --- DELETE CONTROLLER (FIXED) ---
module.exports.deleteListing = async (req, res, next) => {
  try {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);

    req.flash("success", "Deleted successfully");

    req.session.save((err) => {
      if (err) return next(err);
      return res.redirect("/listings");
    });
  } catch (err) {
    console.error("❌ Error deleting listing:", err);
    req.flash("error", "Could not delete listing");

    req.session.save((saveErr) => {
      if (saveErr) return next(saveErr);
      return res.redirect("/listings");
    });
  }
};
