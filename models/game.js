const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
    {
        title: String,
        description: String,
        image: String,
        followersCount: {
            type:Number,
            default: 0
        },
        viewersCount: {
            type:Number,
            default: 0
        },
        status: {
            type: Boolean,
            default: true
        },
        coverImage: String,
        tags: [{
            type: mongoose.Types.ObjectId,
            ref: "Tag"

        }]
    },
    {
        versionKey: false // to disable __v
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Game", gameSchema);
