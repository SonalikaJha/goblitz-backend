const fs = require('fs');
const path = require('path');
const moment = require('moment');

module.exports = function(err, req, res, next) {
    const errorStream = fs.createWriteStream(path.join(__dirname, '..', 'logs', 'error-' + moment().format('YYYY-MM-DD') + '.log'), {flags: 'a'});
    // console.log('here', err.name, JSON.stringify(err.message), err.lineNumber, err.stack);
    errorStream.write('\n------------------------------\n')
    errorStream.write('Error ' + moment().toISOString())
    errorStream.write('\n------------------------------\n')
    errorStream.write(err.stack);
    errorStream.write('\n------------------------------\n')
    errorStream.end();
    return res.json({message: "Internal Server Error"}).status(500);
}