const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    token: String,
    isConsumed: Boolean
}, {
    timestamps: true
});

module.exports = mongoose.model('PasswordReset', passwordResetSchema);