const twilio              = require("twilio");
const config              = require("config");

const accountSid = config.accountSid 
const authToken = config.authToken 
const client = new twilio(accountSid, authToken);

async function sendMessage(data) {
  client.messages
    .create({
      body: data.message,
      to: data.to,
      from: config.twilioNumber, // From a valid Twilio number
    })
    .then((message) => {
      console.log(message.sid);
    })
    .catch((err) => console.log(err));
}

module.exports = sendMessage;
