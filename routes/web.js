var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json({
    'Go': 'Blitz'
  }).status(200);
});

router.get('/delete/users', function(req, res) {
  require('../models/user').deleteMany({}).then(users => res.json(users));
});

module.exports = router;
