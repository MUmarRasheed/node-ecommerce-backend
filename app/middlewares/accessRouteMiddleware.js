const accessApis = require("../apis/accessApis.json");
const roles = require("../roles/roles.json");
const { sendResponse } = require("../helpers/utalityFunctions");
const messages = require("../messages/customMessages");

// This Middleware will check if the user has access to the requested API after login
function checkApiAccessMiddleware(req, res, next) {
  // Split the API endpoint, ignoring query parameters
  let url = req.url;
  url = url.replace("/api/", "").split("?")[0]; // Ignore query parameters
  
  const urlParts = url.split("/");
  
  // Get the action part only
  const actionUrl = urlParts.slice(1).join("/").split("/")[0]; 
  
  // Get the requested HTTP method from Request
  let method = req.method;
  let role = req.loginUser.role ? req.loginUser.role : req.body.role; // Pass the dynamic role based on request

  // Check user access
  if (accessApis[roles[role]][method.toLowerCase()].includes(actionUrl)) {
    next();
  } else {
    return res.status(401).send(sendResponse(1002, messages[1002], false, false));
  }
}

module.exports = checkApiAccessMiddleware;
