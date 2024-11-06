const bcrypt                                          = require("bcrypt");
const Users                                           = require("../models/users");
const config                                          = require("config");
const { validationResult }                            = require("express-validator");
const messages                                        = require("../messages/customMessages");
const sendEmail                                       = require("../helpers/sendEmail");
const stripe                                          = require("stripe")(config.stripeClientSecret);
const crypto                                          = require('crypto');
const Shop                                            = require("../models/shops");

const {
  sendResponse,
  getToken,
  getEmailTemplate,
  getLoginToken,
  convertToObjectId,
  generateSlug
} = require("../helpers/utalityFunctions");

//REGISTER
async function registerUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
  }

  const { email, name, role, password, ownerName, address, phone, website, category } = req.body;
  let user = await Users.findOne({ email });

  if (user) {
    return res.status(400).send(sendResponse(1010, messages[1010], false, false)); // Email already registered
  }

  // Create new user instance
  user = new Users({
    email,
    password,
    name: role === 1 ? name : undefined, // If role is 1, set name ,
    
    role,
    isEmailVerified: role === 1, // Set email verification status directly for admins
    shopStatus: role === 2 ? false : undefined, // Add shopStatus as false if role is 2
  });

  await user.save(); // Save user before creating shop

  // If role is 2, create a new shop
  if (role === 2) {
    const shop = new Shop({
      ownerId: user._id,
      ownerName: ownerName,
      address: address,
      phone: phone,
      website: website,
      name: name, // Shop name should be the same as the user's name
      slug: generateSlug(name), // Create a slug for the shop
      description: "", // Add default description or get from req.body if needed
      category: category,
      isActive :  false,
      isApproved : false, 
      coverImage: {
        thumbnail: "", // Default or placeholder
        original: "" // Default or placeholder
      },
      logo: {
        thumbnail: "", // Default or placeholder
        original: "" // Default or placeholder
      },
    });

    await shop.save(); // Save the new shop
  }

  // Prepare email data for non-admin users only
  if (role !== 1) {
    const verificationToken = crypto.randomBytes(32).toString('hex'); 
    const verificationTokenExpiry = Date.now() + 3600000; // Token expires in 1 hour

    // Update user instance with token details for non-admin users
    user.verificationToken = verificationToken; // Store verification token
    user.verificationTokenExpiry = verificationTokenExpiry; // Store the expiry date
    await user.save(); // Save changes to user

    const emailData = {
      name,
      verificationLink: `${config.apiUrl}api/users/verify-email?token=${verificationToken}`, // Verification link
    };

    const emailHtml = await getEmailTemplate(emailData, "emailVerification.hbs", false, false);

    // Send verification email
    await sendEmail(email, config.mailEmail, emailHtml, emailData, "", config.verifySubject, "");
  }

  return res.status(200).send(sendResponse(1020, messages[1020], true, true));
}

async function verifyEmail(req, res) {
  const { token } = req.query;

  // Find user with the verification token
  const user = await Users.findOne({ verificationToken: token });
  console.log("🚀 ~ verifyEmail ~ user:", user)

  if (!user) {
    return res.status(400).send(sendResponse(1005, messages[1005], false, false)); // Token not found
  }
  if (user.isEmailVerified) {
    return res.status(400).send(sendResponse(1018, messages[1018], false, false)); // Token not found
  }
  // Check if token has expired
  if (user.verificationTokenExpiry < Date.now()) {
    return res.status(400).send(sendResponse(1030, messages[1030], false, false)); // Token expired
  }

  // If token is valid and not expired, verify the email
  user.isEmailVerified = true;
  user.verificationToken = null; // Clear the token after use
  user.verificationTokenExpiry = null; // Clear the expiry date
  await user.save();

  return res.status(200).send(sendResponse(1031, messages[1031], true, false)); // Email verified successfully
}


//LOGIN API
async function login(req, res) {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
  }

  let query = { email: req.body.email.toLowerCase() };

  try {
    let user = await Users.findOne(query);
    
    if (!user) {
      return res.status(400).send(sendResponse(1005, messages[1005], false, false)); // User not found
    }
    
    if (user.isBlocked) {
      return res.status(400).send(sendResponse(1044, messages[1044], false, false)); // User is blocked
    }
    
    if (!req.body.password || !user.password) {
      return res.status(400).send(sendResponse(1051, messages[1051], false, false)); // Missing password
    }

    // Check if the user is an agency admin (role 2) and if shopStatus is false

    if (user.role === 2 && user.isEmailVerified  && !user.shopStatus) {
      console.log("🚀 ~ login ~ user.shopStatus:", user.shopStatus)
      return res.status(403).send(sendResponse(1060, "Your shop is not active yet.", false, false)); // Inform about inactive shop
    }
    // Check if the user is not an admin and email is not verified
    if (user.role !== 1 && !user.isEmailVerified) {
      console.log("🚀 ~ login ~ user.role :", user.role );
      console.log("User email not verified, sending verification email.");
      
      // Generate a new verification token
      let verificationToken = crypto.randomBytes(32).toString('hex');

      // Update user with the token for verification
      user.verificationToken = verificationToken; 
      user.verificationTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour
      await user.save();

      // Prepare email data
      const emailData = {
        name: user.name,
        verificationLink: `${config.apiUrl}verify-email?token=${verificationToken}`, // Verification link
      };
      console.log("🚀 ~ login ~ emailData:", emailData)
    
      const emailSubject = config.verifySubject;

      // Create HTML for the email
      const html = await getEmailTemplate(emailData, "emailVerification.hbs", false, false);

      // Send the verification email
      await sendEmail(user.email, config.mailEmail, html, emailData, "", emailSubject, "");

      // Inform the user to check their email for verification
      return res.status(403).send(sendResponse(1020, messages[1020], false, false)); // Email verification required
    }
    
    // Validate password
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.status(400).send(sendResponse(1012, messages[1012], false, false)); // Incorrect password
    }

    // Successful login
    let token = getLoginToken(user._id);

    // Update user session status
    user.isLoggedIn = true; // Set isLoggedIn to true
    user.token = token; // Save the token in the user record if needed
    await user.save();

    let data = { token, email: user.email, role: user.role };
    return res.status(200).send(sendResponse(1013, messages[1013], true, data)); // Successful login response

  } catch (error) {
    console.error(error);
    return res.status(500).send(sendResponse(1000, messages[1000], false, error)); // General error response
  }
}


async function getUser(req, res){
   let user = await Users.findOne({ email: req.loginUser.email}, { password: 0 , __v: 0, verificationToken: 0, verificationTokenExpiry: 0 } )
  return res.status(200).send(sendResponse(1014, messages[1014], true, user));
}

//LOGOUT
async function logout(req, res) {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
      }

      await Users.updateOne(
          { email: req.loginUser.email },
          { $set: { isLoggedIn: false, token: "" } } // Clear token and set logged out
      );
      return res.status(200).send(sendResponse(1023, messages[1023], true, true));
  } catch (error) {
      console.error("Error in logout:", error);
      return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}


//DELETE ACCOUNT
async function deleteAccount(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    const user = await Users.findOne({ email: req.loginUser.email }, { email: 1, stripeCustomerId: 1, role: 1 });
    if (!user) return res.status(400).send(sendResponse(1005, messages[1005], false, false));

    if (user?.stripeCustomerId) {
      try {
        const stripeAccountDeleted = await stripe.customers.del(user.stripeCustomerId);
        console.log("Stripe account deleted:", stripeAccountDeleted);
      } catch (stripeError) {
        console.error("Error deleting Stripe customer:", stripeError.message);
      }
    }

    const result = await Users.deleteOne({ email: req.loginUser.email });
    console.log("User document deleted:", result);

    return res.status(200).send(sendResponse(1025, messages[1025], true, true));
  } catch (error) {
    console.error("Error in deleteAccount:", error);
    return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}

//Forgot Password
async function forgotPassword(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }
    let email = req.body.email.toLowerCase()
    const user = await Users.findOne({ email: email });
    console.log("🚀 ~ forgotPassword ~ user:", user)
    if (!user) {
      return res.status(400).send(sendResponse(1005, messages[1005], false, false));
    }

    const data = user.toObject();
    console.log("🚀 ~ forgotPassword ~ data:", data)
    data.subject = config.forgotPasswordSubject;

      const token = getToken(req.body.email);
      user.token = token;
      await user.save();

    const html = await getEmailTemplate(
      data,
      "forgotPasswordEmail.hbs",
      config.forgotPasswordLink,
      user.token
    );
    sendEmail(data.email, config.mailEmail, html, data, "", data.subject, "");
    return res.status(200).send(sendResponse(1028, messages[1028], true, true));
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}

//UPDATE PASSWORD
async function updatePassword(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    const user = await Users.findOne({ token: req.body.token });
    if (!user) {
      return res.status(400).send(sendResponse(1030, messages[1030], false, false));
    }

    user.password = req.body.password;
    user.active = true;
    user.token = "";

    await user.save();
    return res.status(200).send(sendResponse(1029, messages[1029], true, true));
  } catch (error) {
    console.error("Error in updatePassword:", error);
    return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}

// Update Profile
async function updateProfile(req, res) {
  try {
    // Validate the incoming request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }
   const email = req.loginUser.email
    // Extract password, id, and other update fields from the request body
    const { password, ...updateFields } = req.body;
    // Find the user by ID
    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(404).send(sendResponse(1005, messages[1005], false));
    }

    // Compare the provided password with the stored password hash
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).send(sendResponse(1007, "Incorrect password", false));
    }

    // Remove sensitive fields that should not be updated
    delete updateFields.password; // Don't allow password to be updated via this process
    delete updateFields.email;    // Optional: If you don't want email to be changed via profile update
    delete updateFields.role;
    delete updateFields.token;

    // Update the user details using Object.assign()
    Object.assign(user, updateFields);

    // Save the updated user to the database
    const updatedUser = await user.save();

    // Convert the updated user to a plain object and remove sensitive fields
    const userResponse = updatedUser.toObject();
    delete userResponse.password;
    delete userResponse.email;
    delete userResponse.stripeCustomerId;

    // Return success response with the updated user
    return res.status(200).send(sendResponse(1032, messages[1032], true));
  } catch (error) {
    // Handle duplicate email error if the email is already taken
    if (error.code === 11000 && error.keyPattern.email) {
      return res.status(400).send(sendResponse(1010, messages[1010], false, false));
    }

    console.error("Error in updating profile:", error);
    return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}


async function getUserDetail(req, res) {
  try {
    // Validate incoming request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    const id = req.query.id;

    // Fetch user excluding sensitive fields
    const user = await Users.findOne(
      { _id: id },
      {
        password: 0,
        email: 0,
        role: 0,
        active: 0,
        isLoggedIn: 0,
        stripeCustomerId: 0,
        verificationToken: 0,
        token: 0,
        verificationTokenExpiry: 0
      }
    );

    // If user not found, return 404
    if (!user) {
      return res.status(404).send(sendResponse(1005, messages[1005], false));
    }

    // Return success response with user details
    return res.send(sendResponse(1014, messages[1014], true, user));
  } catch (error) {
    console.error("Error fetching user detail:", error);
    return res.status(500).send(sendResponse(1000, messages[1000], false));
  }
}


const getAllUsers = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
  }

  let options = {
    page: !req.query.page ? 1 : parseInt(req.query.page),
    limit: !req.query.limit ? config.pageSize : parseInt(req.query.limit),
    sort: { createdAt: -1 },
    projection: {
      _id: 1,
      role: 1,
      name: 1,
      about: 1,
      profileImage: 1,
      createdAt: 1,
      email: 1,
      isBlocked: 1,
      country: 1,
    },
  };

  let match = {};
  match.role =  { $exists: true,  $ne: 1 } // Ensure the role field exists
  // If a role is provided in the query, filter accordingly
  const role = req.query.role ? parseInt(req.query.role) : undefined;
  if (role) {
    match.role =  { $exists: true , $ne : 1 } // Ensure the role field exists
    match.role = role;
  }

  try {
    const result = await Users.paginate(match, options);
    return res.send(sendResponse(1034, messages[1034], true, result));
  } catch (err) {
    return res.send(sendResponse(1039, messages[1039], false, err));
  }
};


async function resendVerificationEmail(req, res) {
  const { email } = req.body;

  const user = await Users.findOne({ email });
  if (!user) {
    return res.status(400).send(sendResponse(1001, messages[1001], false, false));
  }

  // Check if the email is already verified
  if (user.isEmailVerified) {
    return res.status(400).send(sendResponse(1040, messages[1040], false, false)); // Already verified
  }

  // Send verification email
  const emailData = {
    name: user.name,
    verificationLink: `${config.link}verify-email?token=${user.verification_token}&email=${email}`

  };

  const data = { name: user.name, email: user.email };
  data.html = await getEmailTemplate(emailData, "emailVerification.hbs", false, false);
  await sendEmail(email, config.mailEmail, data.html, emailData, "", config.verifySubject, "");

  return res.status(200).send(sendResponse(1009, messages[1009], true, true));
}

async function changePassword(req, res) {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
      }

      const user = await Users.findOne({ _id: req.loginUser._id }); // Assuming you're using req.loginUser to get the logged-in user's ID
      if (!user) {
          return res.status(400).send(sendResponse(1005, messages[1005], false, false));
      }

      // Check if the old and new passwords are the same
      if (req.body.oldPassword === req.body.password) {
          return res.status(400).send(sendResponse(1122, messages[1122], false, false)); // Message for old and new passwords being the same
      }

      // Check if the old password matches
      const isMatch = await user.comparePassword(req.body.oldPassword); // Assuming you have a method to compare passwords
      if (!isMatch) {
          return res.status(400).send(sendResponse(1123, messages[1123], false, false)); // Use an appropriate message for password mismatch
      }

      // Update the user's password
      user.password = req.body.password;
      user.active = true;
      user.token = "";

      await user.save();
      return res.status(200).send(sendResponse(1124, messages[1124], true, true));
  } catch (error) {
      console.error("Error in updatePassword:", error);
      return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}


module.exports = {
  login,
  registerUser,
  getUser,
  logout,
  deleteAccount,
  updatePassword,
  forgotPassword,
  updateProfile,
  getUserDetail,
  getAllUsers,
  verifyEmail,
  changePassword
};
