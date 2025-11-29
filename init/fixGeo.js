const mongoose = require("mongoose");
const Listing = require("../models/listing");
const NodeGeocoder = require("node-geocoder");

// 1. Setup Geocoder (The Translator)
const options = {
  provider: "openstreetmap",
};
const geocoder = NodeGeocoder(options);

// 2. Connect to DB
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("Connected to DB");
    fixCoordinates(); // Run the fix function
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

// 3. The Magic Function
const fixCoordinates = async () => {
  // Get all listings
  const allListings = await Listing.find({});

  // console.log(`Found ${allListings.length} listings. Starting update...`);

  for (let listing of allListings) {
    // Skip if it already has valid coordinates
    if (
      listing.geometry &&
      listing.geometry.coordinates.length > 0 &&
      listing.geometry.coordinates[0] !== 0
    ) {
      continue;
    }

    try {
      // A. Ask OpenStreetMap for coordinates
      const res = await geocoder.geocode(listing.location);

      // B. If found, update the listing
      if (res.length > 0) {
        listing.geometry = {
          type: "Point",
          coordinates: [res[0].longitude, res[0].latitude],
        };
        await listing.save();
        // console.log(`✅ Fixed: ${listing.title} (${listing.location})`);
      } else {
        // console.log(`❌ Could not find location for: ${listing.title}`);
        // Optional: Set a default location if not found
        listing.geometry = { type: "Point", coordinates: [0, 0] };
        await listing.save();
      }
    } catch (e) {
      // console.log(`Error updating ${listing.title}:`, e.message);
    }

    // Wait 1 second between requests to be polite to OpenStreetMap (Rate Limiting)
    await new Promise((r) => setTimeout(r, 1000));
  }

  // console.log("All done!");
  mongoose.connection.close();
};
