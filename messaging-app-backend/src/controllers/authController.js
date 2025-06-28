const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.register = async (req, res) => {
    const { email, username, password } = req.body;
    try {
        //check existing shit
        if (await User.findOne({ email })) {
            return res.status(400).json({ msg: "Email already in use" });
        }
        if (await User.findOne({ username })) {
            return res.status(400).json({ msg: "Username taken" });
        }

        //hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        //create user
        const newUser = await User.create({ email, username, passwordHash });

        //create JWT 
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        //ok result
        res.status(201).json({
            token,
            user: { id: newUser._id, email, username },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        //check if the guy real
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: "Invalid Credentials" });
        }

        // check password legit or nah
        const isFR = await bcrypt.compare(password, user.passwordHash);
        if (!isFR) {
            return res.status(400).json({ msg: "Invalid Credentials" });
        }

        // issue JWT for login 
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.json({
            token,
            user: { id: user._id, email: user.email, username: user.username },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};
