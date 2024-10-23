const config = require("config");
const { sendResponse } = require('../helpers/utalityFunctions');
const messages = require('../messages/customMessages');
const User = require('../models/users');
const stripeClientSecret = require('stripe')(config.stripeClientSecret);
const stripeClientPublisherKey = require('stripe')(config.stripePublisherKey);
const { validationResult } = require('express-validator');
const uuid = require('uuid'); // Ensure you import uuid if not already done

/* -------------------------------------------------------------------------- */
/*                                  CARD APIS                                 */
/* -------------------------------------------------------------------------- */
/*
  - Card is added in USD Stripe account.
*/
const addCard = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(sendResponse(1003, messages[1003], false, errors.array()));
  }

  try {
    const userID = req.loginUser._id;
    console.log("🚀 ~ addCard ~ req.loginUser:", req.loginUser)
    const { cardDetails } = req.body;

    // Retrieve user
    const user = await User.findOne({ _id: userID }, { stripeCustomerId: 1 });

    // Check if user exists
    if (!user) {
      return res.status(404).send(sendResponse(1004, messages[1004], false, 'User not found.'));
    }

    // Create a new Stripe customer if stripeCustomerId does not exist
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripeClientSecret.customers.create({
        email: req.loginUser.email, // Assuming you have the user's email in req.user
      });
      console.log("🚀 ~ addCard ~ customer:", customer)
      stripeCustomerId = customer.id;

      // Update user with the new stripeCustomerId (optional)
      user.stripeCustomerId = stripeCustomerId;
      await user.save(); // You may choose not to save this if you only want to manage cards in Stripe
    }

    // Create card token for USD card
    const usdCardToken = await stripeClientPublisherKey.tokens.create({ card: cardDetails });
    console.log("🚀 ~ addCard ~ usdCardToken:", usdCardToken)

    // Attach the USD card to the customer in Stripe
    const usdCard = await stripeClientSecret.customers.createSource(stripeCustomerId, { source: usdCardToken.id });

    // Optionally, return the card details without saving them in your local user model
    return res.status(200).send(sendResponse(1041, messages[1041], true, 'card added successfully'));
  } catch (error) {
    console.log("🚀 ~ addCard ~ error:", error);
    return res.status(400).send(sendResponse(1000, messages[1000], false, error.message));
  }
};



/*
 * Get Card API
 */
const getCards = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(sendResponse(1003, messages[1003], false, errors.array()));
  }

  try {
    const userID = req.loginUser._id;

    // Retrieve user
    const user = await User.findOne({ _id: userID }, { stripeCustomerId: 1 });

    // Check if user exists and has a Stripe Customer ID
    if (!user || !user.stripeCustomerId) {
      return res.status(404).send(sendResponse(1004, messages[1004], false, 'User not found or no Stripe customer ID.'));
    }

    const stripeCustomerId = user.stripeCustomerId;

    // Retrieve cards from Stripe
    const cards = await stripeClientSecret.customers.listSources(stripeCustomerId, {
      object: 'card',
    });
    
    // Log the retrieved cards for debugging
    console.log("🚀 ~ getCards ~ cards:", cards);

    // Return the array of card data in the response
    return res.status(200).send(sendResponse(1041, messages[1041], true, cards.data));
  } catch (error) {
    console.log("🚀 ~ getCards ~ error:", error);
    return res.status(400).send(sendResponse(1005, messages[1005], false, error.message));
  }
};


/*
 * Remove Card API
*/
const removeCard = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(sendResponse(1003, messages[1003], false, errors.array()));
  }

  try {
    const userID = req.loginUser._id;  // Use _id from the logged-in user
    const { cardId } = req.body;

    // Retrieve the user's Stripe Customer ID and card details from your local database
    const user = await User.findOne({ _id: userID }, { stripeCustomerId: 1, cards: 1 });

    // Check if user exists
    if (!user) {
      return res.status(404).send(sendResponse(1004, messages[1004], false, 'User not found'));
    }

    // Delete the card from Stripe
  let removeCard =  await stripeClientSecret.customers.deleteSource(user.stripeCustomerId, cardId);
  console.log("🚀 ~ removeCard ~ removeCard:", removeCard)

    // Return success response
    return res.status(200).send(sendResponse(5637, messages[5637], true, 'Card removed successfully'));
  } catch (error) {
    console.log("🚀 ~ removeCard ~ error:", error);
    return res.status(400).send(sendResponse(1005, messages[1005], false, error.message));
  }
};


module.exports = {
  addCard,
  getCards,
  removeCard
};
