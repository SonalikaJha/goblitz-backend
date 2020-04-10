const mongoose = require('mongoose');

const searchLogSchema = new mongoose.Schema({
    term: String,
    count:{
        type:Number,
        default: 0
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('SearchLog', searchLogSchema);
