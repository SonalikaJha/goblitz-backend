class ResponseHelper {
    /**
     * Generic responses
     */

    /**
     * send validation error
     * @param res
     * @param error
     * @returns {*}
     */

    static validationResponse(res, error) {
        const statusCode = 422;
        const response = this.getResponse(error, 'Validation Error');
        return res.status(statusCode).json(response);
    }

    /**
     * send success response (status code: 200)
     * @param res
     * @param data
     * @param message
     * @returns {*}
     */

    static response200(res, data = {}, message = 'ok') {
        const statusCode = 200;
        const response = this.getResponse(data, message);
        return res.status(statusCode).json(response);
    }

    static response400(res, data, message = 'Bad Request') {
        const statusCode = 400;
        const response = this.getResponse(data, message);
        return res.status(statusCode).json(response);
    }

    /**
     *
     * @param res
     * @param data
     * @param message
     * @returns {*}
     */

    static response404(res, data = null, message = 'not found') {
        const statusCode = 404;
        const response = this.getResponse(data, message);
        return res.status(statusCode).json(response);
    }

    /**
     * Internal Server Error
     * @param res
     * @param data
     * @param message
     * @returns {*}
     */

    static response500(res, data = null, message = "Internal Server Error") {
        const statusCode = 500;
        const response = this.getResponse(data, message);
        return res.status(statusCode).json(response);
    }

    /**
     * get response generic function
     * @param data
     * @param message
     * @returns {{}}
     */

    static getResponse(data, message) {
        const response = {};
        response.message = message;
        if (data) {
            response.data = data;
        }
        return response
    }
}

module.exports = ResponseHelper;
