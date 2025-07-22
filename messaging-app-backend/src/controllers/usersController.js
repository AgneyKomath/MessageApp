const User = require("../models/User");

exports.getUsers = async (req, res) => {
    try {
        const me = req.user.id;
        const users = await User.find({ _id: { $ne: me } }, "username email");
        res.json(users);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "Server error" });
    }
};
