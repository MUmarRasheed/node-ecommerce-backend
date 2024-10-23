const Users                                           = require("../models/users");
const messages                                        = require("../messages/customMessages");
const {sendResponse,getEmailTemplate,getLoginToken}   = require("../helpers/utalityFunctions");
const sendEmail                                       = require('../helpers/sendEmail')
const axios                                           = require('axios');
const { validationResult }                            = require("express-validator")
const config                                          = require('config')


// Google Login
async function loginWithGoogle(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
  }

  try {
    const { id_token } = req.body;

    // Validate the id_token with Google
    const googleResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${id_token}`
    );

    console.log("🚀 ~ loginWithGoogle ~ googleResponse:", googleResponse.data);

    // Ensure that the Google response contains the necessary information
    const { email } = googleResponse.data;
    if (!email) {
      throw new Error("Invalid Google response");
    }

    // Fetch detailed user info
    const userInfo = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${id_token}` },
      }
    );

    let user = await Users.findOne({ email: email });
    let data;
    const currentTime = new Date().getTime(); // Get the current date and time
    console.log("🚀 ~ loginWithApple ~ currentTime:", currentTime)
    if (!user) {
      
      user = new Users({
        name: userInfo?.data?.name,
        email: email,
        lastLoginTime: currentTime, // save the last login time 
        isLoggedIn: true,
        profileImage: userInfo.data.picture,
        active: false,
        loginType: "google login"
      });
      await user.save();

      data = {
        _id: user._id,
        email: user.email,
        token: getLoginToken(user._id),
        role: user?.role,
        name: userInfo?.data?.name,
        profileImage: userInfo.data.picture,
        isLoggedIn: true
      };

      if(data.role === 2) {
        data.subject = config.RegistrationSubject;
      }
      data.link = ""; // redirect after register
  
      data.html = await getEmailTemplate(data, "register.hbs", false, false);
      const emailSent = sendEmail(data.email, config.mailEmail, data.html, data, "", data.subject, "");
      
      // delete from response
      delete data.html
      delete data.subject
      delete data.link

      res.status(200).json(sendResponse(1013, messages[1013], true, data));
    } else {
      // Check if the user is blocked
      if (user.isBlocked) {
        return res.status(400).send(sendResponse(1122, messages[1122], false, false));
      }

      await Users.updateOne(
        { email: email },
        {
          email: email,
          profileImage: userInfo.data.picture,
          isLoggedIn: true,
          active: true,
          lastLoginTime: currentTime, // save the last login time 
        }
      );

      data = {
        _id: user._id,
        email: email,
        token: getLoginToken(user._id),
        isLoggedIn: true,
        role: user?.role,
        active: user?.active,
        name: user?.name,
        profileImage: user?.profileImage,
      };

      res.status(200).json(sendResponse(1013, messages[1013], true, data));
    }
  } catch (error) {
    console.error("Error during Google login:", error.message);
    res.status(500).send(sendResponse(1000, messages[1000], false, error));
  }
}

module.exports = {
  loginWithGoogle
};
