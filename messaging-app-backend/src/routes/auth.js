const router = require("express").Router();
const { register, login } = require("../controllers/authController");

// register route
router.post("/register", register);

// login route
router.post("/login", login);

module.exports = router;
