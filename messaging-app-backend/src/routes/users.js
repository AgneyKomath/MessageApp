const router = require("express").Router();
const { getUsers } = require("../controllers/usersController");

// Get all users
router.get("/", getUsers);

module.exports = router;
