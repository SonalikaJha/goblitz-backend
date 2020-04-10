const mongoose = require("mongoose");

const userStreamSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Types.ObjectId,
            ref: "User"
        },
        game: {
            type: mongoose.Types.ObjectId,
            ref: "Game"
        },
        gameTitle: String,
        gameDescription: String,
        startTime: Date,
        endTime: Date,
        totalChatUsers: [
            {
                type: mongoose.Types.ObjectId,
                ref: "User"
            }
        ],
        totalLiveViews: {
            type: Number,
            default: -1
        },
        streamInputUrl: String,
        streamOutputUrl: String,
        streamHlsUrl: String,
        playbackUrl: String,
        totalPlaybackViews:{
            type: Number,
            default: 0
        },
        duration: String,
        status: Boolean,
        streamId: String,
        tags: [
            {
                type: mongoose.Types.ObjectId,
                ref: "Tag"
            }
        ],
        isLive: {
            type :Boolean,
            default: false
        },
        coverImage: String
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('UserStream', userStreamSchema);
