const accessApis                        = require("../apis/accessApis.json");
const roles                             = require("../roles/roles.json");
const { sendResponse }                  = require("../helpers/utalityFunctions");
const messages                          = require("../messages/customMessages");

//This Middleware will check user have the access of api which he is requested and called after the login
function checkApiAccessMiddleware(req, res, next) {
  //split the api endPoint
  let url = req.url;
  url = url.replace("/api/", "");
  url = url.split("/")[0];
  url = url.split("?")[0];

  //get the requested http method from Request
  let method = req.method;
  let role = req.loginUser.role ? req.loginUser.role : req.body.role; // have to pass the dynamic role based on request

  //check the user
  if (accessApis[roles[role]][method.toLowerCase()].includes(url)) {
    next();
  } else {
    let err = false;
    return res.status(401).send(sendResponse(1002, messages[1002], false, err));
  }
}

module.exports = checkApiAccessMiddleware;
