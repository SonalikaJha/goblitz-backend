const storage = require('../config/storage');

module.exports = class AllChannelsResponseConstructor {
    constructor(req) {
        this.id = req._id || null;
        this.username = req.user.username || '';
        this.userProfileImage = req.user.profileImage || storage.defaultUserProfileImage;
        this.userCoverImage = req.user.coverImage || storage.defaultUserProfileImage;
        this.gameTitle = req.game && req.game.title || '';
        this.gameImage = req.game && req.game.image || storage.defaultGameImage;
        this.streamTitle = req.gameTitle || '';
        this.streamDescription = req.gameDescription || '';
        this.streamImage = req.coverImage || storage.defaultStreamCoverImage;
        this.streamTags = req.tags || [];
        this.totalPlaybackViews = req.totalPlaybackViews || 0;
        this.isLive = req.isLive || false;
        this.followersCount = req.user.followersCount || 0;
        this.videoCount = req.user.videoCount || 0;
        this.viewersCount = req.user.viewersCount || 0;
        this.bio = req.user.bio || '';
    }
};
