const mongoose = require("mongoose");

const gameUserFollowerSchema = new mongoose.Schema(
    {
        game: {
            type: mongoose.Types.ObjectId,
            ref: "Game"
        },
        user: {
            type: mongoose.Types.ObjectId,
            ref: "User"
        },
        isFollowed: Boolean,
        //tag: [String],
        status: Boolean,
        ipAddress: String
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "GameUserFollower",
    gameUserFollowerSchema
);
