const config                = require("config");
const mongoosePaginate      = require("mongoose-paginate-v2");
const Handlebars            = require("handlebars");
var jwt                     = require("jsonwebtoken");
const fs                    = require('fs').promises;
const path                  = require("path");
const mongoose              = require('mongoose')
const stripe                = require('stripe')(config.stripeClientSecret);

/*
 - This File Contains all the utality function 
 - Write Reusable function in this file 
*/

// RESPONSE HELPER
function sendResponse(messageCode, message, success, data) {
  let response = {
    messageCode: messageCode,
    message: message,
    success: success,
    data: data,
  };
  return response;
}


// PAGINATION HELPER
mongoosePaginate.paginate.options = {
  lean: true,
  limit: config.pageSize,
};
var paginate = mongoosePaginate;

// GET TOKEN HELPER (You can change it according to generate expire token or non expire )
function getToken(email) {
  // Sign the JWT with an expiration time of 5 minutes (300 seconds)
  const token = jwt.sign(
    { email: email },           // Payload data
    config.secretKey,           // Secret key from your configuration
    { expiresIn: '5m' }         // Token expiration (5 minutes)
  );
  return token;
}


// GET TOKEN HELPER (You can change it according to generate expire token or non expire )
function getLoginToken(id) {
  const token = jwt.sign({ id: id }, config.secretKey, { expiresIn: '24hr' });
  return token;
}

async function getEmailTemplate(data, templateName, link, token) {
  const options = {
    name: data.name,
    token: token,
    link: link,
    data: data,
    company: config.company,
    companyLogo: config.companyLogo,
  };
  const source = await fs.readFile(path.resolve(__dirname, "../views/" + templateName), 'utf8');
  const template = Handlebars.compile(source);
  const result = template(options);
  return result;
}


//CUSTOM VALIDATE THE OBJECT ID
const isValidObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid ObjectId");
  }
  return true;
};

/**
 * Convert a string to a Mongoose ObjectId.
 * @param {string} id - The string to convert to ObjectId.
 * @returns {mongoose.Types.ObjectId} - The converted ObjectId.
 * @throws {Error} - Throws an error if the provided string is not a valid ObjectId.
 */
function convertToObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid ObjectId format");
  }
  return new mongoose.Types.ObjectId(id);
}

function convertToMultipleObjectIds(ids) {
  if (Array.isArray(ids)) {
      // Convert an array of IDs to ObjectIds, filtering out invalid ones
      const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length !== ids.length) {
          throw new Error("One or more invalid ObjectId formats found");
      }
      return validIds.map(id => new mongoose.Types.ObjectId(id));
  } else if (typeof ids === 'string') {
      // Handle single ID case
      if (!mongoose.Types.ObjectId.isValid(ids)) {
          throw new Error("Invalid ObjectId format");
      }
      return new mongoose.Types.ObjectId(ids);
  } else {
      throw new Error("Input must be a string or an array of strings");
  }
}


async function createStripeAccount(email) {
  let data = {};
  // Create USD customer
  const stripeCustomer = await stripe.customers.create({ email: email });
  data = stripeCustomer;
  return data;
}

async function generateRandom(numDigits) {
  const min = 10 ** (numDigits - 1);
  const max = 10 ** numDigits - 1;
  return Math.floor(min + Math.random() * (max - min + 1));
}

// Function to calculate discounted price
function calculateDiscountedPrice(amountPerClass, numberOfClasses) {
  const totalAmount = amountPerClass * numberOfClasses;
  const discountRate = 0.05; // 5% discount
  const discountedAmount = totalAmount * (1 - discountRate); // Apply discount first
  const amountWithVAT = calculateAmountWithVAT(discountedAmount); // Then apply VAT
  return parseFloat(amountWithVAT.toFixed(2));
}

// Helper function to check slot availability
const checkSlotAvailability = (slot, availableSlots) => {
  return availableSlots.some(
    (availableSlot) =>
      availableSlot.startTime === slot.startTime &&
      availableSlot.endTime === slot.endTime
  );
};

const calculateAmountWithVAT = (amount) => {
  const vatMultiplier = 1 + config.vatPercentage / 100;
  const amountWithVAT = parseFloat((amount * vatMultiplier).toFixed(2));
  console.log("🚀 ~ calculateAmountWithVAT ~ amountWithVAT:", amountWithVAT)
  return amountWithVAT;
};


// Function to create a payment intent using Stripe
const createPaymentIntent = async (currency, totalAmount, buyerStripeCustomerId, cardId) => {
  try {
    const amountInCents = Math.round(totalAmount * 100);
    const stripePaymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      customer: buyerStripeCustomerId,
      description: "Payment for booking",
      payment_method: cardId,
      confirm: true, // Set this to true for immediate confirmation
      return_url: `${config.returnURL}`, // Specify the return URL for redirect-based payments
    });
    console.log("🚀 ~ createPaymentIntent ~ stripePaymentIntent:", stripePaymentIntent);

    return stripePaymentIntent;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw error;
  }
};


// Function to cancel a PaymentIntent and refund a specific amount
const refundPaymentIntent = async (paymentIntentId, refundAmount) => {
  const amountInCents = Math.round(refundAmount * 100);

  try {
    // Refund a specific amount
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amountInCents, // Specify the amount to refund
    });

    console.log("🚀 ~ refundPaymentIntent ~ refund:", refund)

    return refund.amount; // Return the specific refunded amount
  } catch (error) {
    console.error("Error canceling payment intent:", error);
    throw error;
  }
};

// utils/slugGenerator.js

function generateSlug(name) {
  return name
      .toLowerCase() // Convert to lowercase
      .trim() // Remove leading/trailing whitespace
      .replace(/[\s]+/g, '-') // Replace spaces with hyphens
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-') // Replace multiple hyphens with a single hyphen
      .replace(/^-+/, '') // Trim hyphens from the start
      .replace(/-+$/, ''); // Trim hyphens from the end
}

module.exports = {
  sendResponse,
  paginate,
  getToken,
  getEmailTemplate,
  getLoginToken,
  isValidObjectId,
  createStripeAccount,
  generateRandom,
  calculateDiscountedPrice,
  checkSlotAvailability,
  convertToObjectId,
  calculateAmountWithVAT,
  createPaymentIntent,
  refundPaymentIntent,
  generateSlug,
  convertToMultipleObjectIds
};
