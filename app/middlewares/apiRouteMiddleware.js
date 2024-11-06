const express = require("express");
const fs = require("fs");
const { sendResponse } = require("../helpers/utalityFunctions");
const messages = require("../messages/customMessages");

// This Middleware will check if the API route is valid or not
function checkRouteMiddleware(req, res, next) {
  // Read the APIs from allApis.json
  const apiFile = fs.readFileSync("app/apis/allApis.json");
  const apis = JSON.parse(apiFile);

  // Extract the API endpoint
  let url = req.url;
  
  // Remove the `/api/` prefix and split the URL, ignoring query parameters
  const urlParts = url.replace("/api/", "").split("?")[0].split("/");
  
  // Extract the action part and ignore everything after it
  const actionUrl = urlParts.slice(1).join("/").split("/")[0]; // Get the action part only

  // Check if the requested action URL is included in our APIs
  if (apis.includes(actionUrl)) {
    next(); // If valid, proceed to the next middleware or route handler
  } else {
    return res.status(404).send(sendResponse(1001, messages[1001], false, false)); // If invalid, return 404
  }
}

module.exports = checkRouteMiddleware;
