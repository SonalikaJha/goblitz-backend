const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const env = require('dotenv');
const fileupload = require('express-fileupload');
const cors = require('cors');
const fs = require('fs');
//const emitter = new events.EventEmitter();
// const moment = require('moment');

/**
 * Initialize express
 */
const app = express();

/**
 * Enable logger
 */
// app.use(logger('common', {stream: fs.createWriteStream(path.join(__dirname, 'logs', 'access-' + moment().format('YYYY-MM-DD') + '.log'), {flags: 'a'})}));
app.use(logger('dev'));

/**
 * Enable project to react .env
 */
env.config();

/**
 * Make express ready for input
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileupload());
app.use(cookieParser());

/**
 * Set static files path
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Enable CORS
 */
app.use(cors());

/**
 * Add DB
 */
const db = require('./engine/db');

/**
 * Bootstrap routes
 */
app.use(require('./engine/routes'));

// emitter.on('status', function (data) {
//     io.emit('status', data);
// });

/**
 * Export our app
 */
module.exports = app;
