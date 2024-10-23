const express           = require("express");
const loginRouter       = express.Router();

/*  IMPORT Validators */

const cardValidator = require('../validators/card')

/*  IMPORT CONTROLLERS */

const CardController                     = require("../controllers/card");

loginRouter.post("/add-card",cardValidator("addCard"), CardController.addCard)
loginRouter.get("/get-cards", CardController.getCards)
loginRouter.delete("/remove-card", CardController.removeCard)

module.exports = { loginRouter };