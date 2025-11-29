// 🛑 CRITICAL FIX: Add dotenv to read the cloud URL from the .env file

const mongoose = require("mongoose");
const initdata = require("./data.js");
const Listing = require("../models/listing.js");

const ATLAS_DB_URL = process.env.ATLASDB_URL;

//established a connection
main()
  .then((res) => {
    console.log("connection successful initialize");
  })
  .catch((err) => {
    console.log(err);
  });
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
}

//create a function to intiliaize data
const initdb = async () => {
  await Listing.deleteMany({}); //first dlete al the data

  initdata.data = initdata.data.map((obj) => ({
    ...obj,
    owner: "691d11ede8638566ea77d34b",
  }));
  await Listing.insertMany(initdata.data);
};
initdb();
