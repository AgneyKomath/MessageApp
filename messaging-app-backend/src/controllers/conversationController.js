const Conversation = require("../models/Conversation");
const User = require("../models/User");

exports.createConversation = async (req, res) => {
    const userId = req.user.id;
    const { otherUserId } = req.body;

    if (userId === otherUserId) {
        return res.status(400).json({ msg: "Are you Schizophrenic? You can't talk to yourself!" });
    }

    try {
        //check is user real or nah
        const other = await User.findById(otherUserId);
        if (!other) {
            return res.status(404).json({ msg: "Fake user, not found!" });
        }

        //check if conversation already exists
        let convo = await Conversation.findOne({
            participants: { $all: [userId, otherUserId] },
        });

        if (!convo) {
            convo = await Conversation.create({
                participants: [userId, otherUserId],
            });
        }
        convo = await convo.populate("participants", "username");
        res.status(201).json(convo);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "Server error" });
    }
};

exports.getConversations = async (req, res) => {
    const userId = req.user.id;
    try {
        const convos = await Conversation.find({ participants: userId }).sort({ updatedAt: -1 }).populate("participants", "username");
        res.json(convos);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "Server error" });
    }
};
