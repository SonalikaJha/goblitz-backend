const mongoose = require("mongoose");

const userSubscriptionSchema = new mongoose.Schema(
    {
        channel: {
            type: mongoose.Types.ObjectId,
            ref: "User"
        },
        user: {
            type: mongoose.Types.ObjectId,
            ref: "User"
        },
        isSubscribed: Boolean,
        ipAddress: String
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);
