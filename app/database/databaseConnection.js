const config                                      = require("config");
const mongoose                                    = require("mongoose");

//Creates a Database Connection
function mongoConnect() {
  mongoose.connect(config.MONGOCONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  // mongoose.set({ debug: true })
  mongoose.connection.on("error", (err) => {
    console.log("err", err);
  });
  mongoose.connection.on("connected", (err, res) => {
    console.log("MongoDB is Connected");
  });
  mongoose.set({debug:true})
}

module.exports = mongoConnect;
