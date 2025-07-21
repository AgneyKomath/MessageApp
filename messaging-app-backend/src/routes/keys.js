const router = require("express").Router();
const { upsertKey, getKey } = require("../controllers/keyController");

// store or update own public key
router.post("/", upsertKey);

// fetch someone else’s public key
router.get("/:userId", getKey);

module.exports = router;
