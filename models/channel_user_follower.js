const mongoose = require("mongoose");

const channelUserFollowerSchema = new mongoose.Schema(
    {
        channel: {
            type: mongoose.Types.ObjectId,
            ref: "User"
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
    "ChannelUserFollower",
    channelUserFollowerSchema
);
