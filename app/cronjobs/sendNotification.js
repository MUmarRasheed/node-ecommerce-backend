const cron                     = require("node-cron");
const config                   = require('../config/default.json')
const mongoConnect             = require("../database/databaseConnection");


//Connect MongoDatabase
mongoConnect();

// CRON JOB
cron.schedule("*/10 * * * * *", async () => {
  console.log("running a task every 10 sec");

  // Write your functionality 
});
