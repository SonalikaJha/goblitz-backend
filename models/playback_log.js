const mongoose = require("mongoose");

const playbackLogSchema = new mongoose.Schema(
    {
        userStream: {
            type: mongoose.Types.ObjectId,
            ref: "UserStream"
        },
        status: boolean,
        playbackUrl: String,
        totalPlaybackViews: String,
        playbackAddTime: String,
        sortOrder: String,
        isTrending: String,
        isPromoted: String
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('PlaybackLog', playbackLogSchema);
