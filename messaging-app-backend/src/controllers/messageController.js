const Message = require("../models/Message");

exports.getMessages = async (req, res) => {
    const { convoId } = req.params;
    try {
        const msgs = await Message.find({ conversation: convoId }).sort({ createdAt: 1 }).populate("sender", "username");
        res.json(msgs);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "Server error" });
    }
};

exports.sendMessage = async (req, res) => {
    const userId = req.user.id;
    const { convoId } = req.params;
     const { iv, data } = req.body;

    try {
        const msg = await Message.create({
            conversation: convoId,
            sender: userId,
            iv,
            data
        });
        const populated = await msg.populate("sender", "username");
        res.status(201).json(populated);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "Server error" });
    }
};
