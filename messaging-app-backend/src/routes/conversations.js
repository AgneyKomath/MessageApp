const express = require("express");
const { createConversation, getConversations } = require("../controllers/conversationController");
const router = express.Router();

router.post("/", createConversation);

router.get("/", getConversations);

module.exports = router;
