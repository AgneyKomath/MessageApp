const mongoose = require("mongoose");

const KeySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
        pubJwk: { type: Object, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Key", KeySchema);
