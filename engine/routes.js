const express = require("express");
const Router = express.Router();

const errorHandler = require('./error_handler');

/**
 * Register your routes here
 */
Router.use("/", require("../routes/web"));
Router.use("/api", require("../routes/api"));
Router.use("/api/v1", require("../routes/api_v1"));

Router.use(errorHandler);

/**
 * Fallback Route
 */
Router.use("*", (req, res) => {
  res.json(
    {
      message: "You might be lost"
    },
    404
  );
});

/**
 * Export the circuit
 */
module.exports = Router;
