const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.DB_MONGO, {});
    console.log("DB Conectada");
  } catch (error) {
    console.log("ERROR", error);
    process.exit(1); // Detiene la app
  }
};

module.exports = conectarDB;
