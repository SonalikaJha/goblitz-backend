module.exports = class CustomError {
    constructor(option = {error: null, message: null, line: null, fileName: null}) {
        this.error = option.error;
        this.message = option.message;
        this.line = option.line;
        this.fileName = option.fileName;
    }
};