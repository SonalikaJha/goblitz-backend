const NodeMediaServer = require('../services/NodeMediaServer');
const events = require('events');
const emitter = new events.EventEmitter();

class NodeMediaServerController{
    static nodeMediaServerController(method, data) {
        switch (method) {
            case 'showData':
                NodeMediaServer.getData(function (response) {
                    return response ;
                });
                break;
            case 'onPublish':
                emitter.emit('status', data);
                break;
            case 'donePublish':
                emitter.emit('status', data);
                break;
            default:
                console.log("No method found");
                break;
        }
    }
}

module.exports = NodeMediaServerController;
