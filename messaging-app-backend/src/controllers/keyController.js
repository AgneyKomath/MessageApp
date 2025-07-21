const Key = require("../models/Key");

// POST /api/keys
exports.upsertKey = async (req, res) => {
    const userId = req.user.id;
    const { pubJwk } = req.body;
    try {
        await Key.findOneAndUpdate({ userId }, { pubJwk }, { upsert: true, new: true });
        return res.sendStatus(204);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "Server error" });
    }
};

// GET /api/keys/:userId
exports.getKey = async (req, res) => {
    const { userId } = req.params;
    try {
        const rec = await Key.findOne({ userId });
        if (!rec) return res.status(404).json({ msg: "Key not found" });
        return res.json({ pubJwk: rec.pubJwk });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "Server error" });
    }
};
