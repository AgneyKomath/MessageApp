const router = require("express").Router();
const { getMessages, sendMessage } = require("../controllers/messageController");

router.get("/:convoId", getMessages);

router.post("/:convoId", sendMessage);

module.exports = router;