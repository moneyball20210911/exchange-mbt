const dbConfig = require("../config/db.config.js");

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = dbConfig.url;
db.Users = require("./users.js")(mongoose);
db.Payments = require("./payments.js")(mongoose);

module.exports = db;
