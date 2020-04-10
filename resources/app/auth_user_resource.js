const Resource = require('../resource');

module.exports = class UserAuthResource extends Resource {
    format(resource) {
        return {
            name: resource.name,
            username: resource.username,
            email: resource.email,
        };
    }
}