const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const config = require("config");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const mongoConnect = require("./app/database/databaseConnection");
const authCheck = require("./app/middlewares/authMiddleware");
const checkApiRouteMiddleware = require("./app/middlewares/apiRouteMiddleware");
const checkApiAccessMiddleware = require("./app/middlewares/accessRouteMiddleware");

const app = express();
const multer = require("multer")
const upload =multer();

app.use(express.json());

app.use(upload.any());
//Database Connection
mongoConnect();

// Using Middlewares
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
};
app.use(cors(corsOptions));
app.options("*", cors());
app.use(helmet());
app.use(function (request, response, next) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  response.header("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  response.header("Cross-Origin-Embedder-Policy", "credentialless");
  response.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  next();
});

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(morgan("combined"));
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes in milliseconds
  next();
});

//Middleware check if the user requested route is valid or not
app.use(function (req, res, next) {
  checkApiRouteMiddleware(req, res, next);
});

// Define Routes where we have openAPi's
app.use("/api", require("./app/routes/users").router);
app.use("/api", require("./app/routes/socialLogin").router);
app.use("/api", require("./app/routes/products").router);
app.use("/api", require("./app/routes/productStocks").router);

//check the authuntication of user
app.use(function (req, res, next) {
  authCheck(req, res, next);
});

//check after login that a user have the access of the apis (User Authorization)
app.use(function (req, res, next) {
  checkApiAccessMiddleware(req, res, next);
});

app.use("/api", require("./app/routes/users").loginRouter);
app.use("/api", require("./app/routes/fileUploads").loginRouter);
app.use("/api", require("./app/routes/card").loginRouter)
app.use('/api', require("./app/routes/productCategory").loginRouter);
app.use('/api', require("./app/routes/productSubcategories").loginRouter);
app.use('/api', require("./app/routes/products").loginRouter);
app.use("/api", require("./app/routes/shops").loginRouter);
app.use("/api", require("./app/routes/productStocks").loginRouter);
app.use("/api", require("./app/routes/cart").loginRouter);
app.use("/api", require("./app/routes/deliveryAddresses").loginRouter);
app.use("/api", require("./app/routes/deliveryContacts").loginRouter);
app.use("/api", require("./app/routes/checkout").loginRouter);

app.listen(config.PORT, async () => {
  console.log(`Server is Running on ${config.PORT}`);
});
