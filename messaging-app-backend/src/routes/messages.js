const express = require("express");
const { getMessages, sendMessage } = require("../controllers/messageController");
const router = express.Router();

router.get("/:convoId", getMessages);

router.post("/:convoId", sendMessage);

module.exports = router;