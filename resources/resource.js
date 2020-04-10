module.exports = class Resource {
    constructor(resource) {
        this.resource = resource;
        return this.prepare();
    }

    /**
     * Formats the return value, extend this function in sub classes
     * @param {*} resource Mongoose Model
     */
    format(resource) {
        return resource;
    }

    /**
     * Prepares the data to be formatted
     */
    prepare() {
        if(this.resource instanceof Array) {
            return this.resource.map(item => {
                return this.format(item);
            });
        } else {
            return this.format(this.resource);
        }
    }

}