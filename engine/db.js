const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/goblitz", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(_ => {
    console.info('Connected to DB');
})
.catch(_ => {
    console.error('Could not connect to DB', _);
});

mongoose.set('useFindAndModify', false);

module.exports = mongoose;

