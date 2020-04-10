const storage = require('../config/storage');

module.exports = class LiveChannelsResponseConstructor {
    constructor(req) {
        this.id = req._id;
        this.username = req.user.username || '';
        this.userProfileImage = req.user.profileImage || storage.defaultUserProfileImage;
        this.gameTitle = req.game && req.game.title || '';
        this.gameImage = req.game && req.game.image || storage.defaultGameImage;
        this.streamTitle = req.gameTitle || '';
        this.streamDescription = req.gameDescription || '';
        this.streamImage = req.coverImage || storage.defaultStreamCoverImage;
        this.streamTags = req.tags || [];
        this.totalLiveViews = req.totalLiveViews || 0;
        this.startTime = req.startTime || 0;
        this.isLive = req.isLive || false;
        this.streamOutputUrl = req.streamOutputUrl || '';
        this.streamHlsUrl = req.streamHlsUrl || '';
    }
};
