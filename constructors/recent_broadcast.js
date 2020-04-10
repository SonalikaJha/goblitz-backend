const storage = require('../config/storage');

module.exports = class RecentBroadcastConstructor {
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
        this.totalPlaybackViews = req.totalPlaybackViews || 0;
        this.duration = req.duration || '';
        this.endTime = req.endTime || '';
        this.playbackUrl = req.playbackUrl || '';
        this.playbackId = req.playbackId || undefined;
    }
};
