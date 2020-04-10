const mongoose = require("mongoose");

const loginLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true
        },
        ipAddress: String,
        status: Boolean,
        remark: String
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("LoginLog", loginLogSchema);
