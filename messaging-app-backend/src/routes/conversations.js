const router = require("express").Router();
const { createConversation, getConversations } = require("../controllers/conversationController");

router.post("/", createConversation);

router.get("/", getConversations);

module.exports = router;
