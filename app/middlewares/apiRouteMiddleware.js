const express                = require("express");
const fs                     = require("fs");
const { sendResponse }       = require("../helpers/utalityFunctions");
const messages               = require("../messages/customMessages");

//This Middleware will check if the api route is valid or not
function checkRouteMiddleware(req, res, next) {
    
  //Read the apis from allapis.json
  var apiFile = fs.readFileSync("app/apis/allApis.json");
  var apis = JSON.parse(apiFile);

  //extract the api endPoint
  let url = req.url;
  console.log("🚀 ~ checkRouteMiddleware ~ req.url:", req.url)
  url = url.replace("/api/", "");
  url = url.split("/")[0];
  url = url.split("?")[0];
  console.log("🚀 ~ checkRouteMiddleware ~ url:", url)

  //check if the requested url is include in our apis
  if (apis.includes(url)) {
    next();
  } else {
    let err = false;
    return res.status(404).send(sendResponse(1001, messages[1001], false, err));
  }
}

module.exports = checkRouteMiddleware;
