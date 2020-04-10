const JWT = require("jsonwebtoken");

const User = require("../models/user");

const response401 = { message: "Unauthenticated" };

module.exports = function(req, res, next) {
  // check if authorization token exists
  const authorizationHeader = req.header("Authorization");
  if (!authorizationHeader) {
    return res.json(response401).status(401);
  }

  //   check if token length is correct
  const splitAuthorizationHeader = authorizationHeader.split(" ");
  if (splitAuthorizationHeader.length !== 2) {
    return res.json(response401).status(401);
  }

  //   extract token
  const token = splitAuthorizationHeader.pop();

  // verify token
  JWT.verify(token, process.env.APP_KEY, function(err, data) {
    if (err) {
      return res.json(response401).status(401);
    }
    // verify user
    User.findOne({
      email: data.email
    })
      .then(user => {
        if (!user) {
          return res.json(response401).status(401);
        }
        // add user to request
        req.user = user.toObject();
        next();
      })
      .catch(e => {
        return res.json({ message: "Internal Server Error" }).status(500);
      });
  });
};
