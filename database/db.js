const mongoose = require("mongoose");

const DB = process.env.MONGOURL;

mongoose
  .connect(DB)
  .then(() => console.log("Database connection established"))
  .catch((err) => console.log(err));
