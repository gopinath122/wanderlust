const mongoose = require("mongoose");
const Listing = require("../models/listing"); // Adjust path if needed

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

// These MUST match your Schema Enum exactly
const categories = [
  "Trending",
  "Rooms",
  "Iconic Cities",
  "Mountains",
  "Castles",
  "Amazing Pools",
  "Camping",
  "Farms",
  "Arctic",
];

main()
  .then(() => {
    console.log("Connected to DB");
    assignCategories();
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const assignCategories = async () => {
  // 1. Get all listings
  const allListings = await Listing.find({});

  // console.log(`Updating ${allListings.length} listings...`);

  for (let listing of allListings) {
    // 2. Pick a random category from the list
    let randomCategory =
      categories[Math.floor(Math.random() * categories.length)];

    // 3. Update the listing
    listing.category = randomCategory;
    await listing.save();

    // console.log(`✅ ${listing.title} -> ${randomCategory}`);
  }

  // console.log("All done! Database migration complete.");
  mongoose.connection.close();
};
