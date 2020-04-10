const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middlewares/auth_middleware');

// Controllers

const ChannelController = require('../controllers/channel_controller');
const PlaybackController = require('../controllers/playback_controller');

router.get('/all-channels', ChannelController.allChannels);
router.get('/live-channels', ChannelController.liveChannels);
router.get('/recent-broadcasts', PlaybackController.recentBroadcast);
router.get('/channel-videos/:username', PlaybackController.channelVideoList);
router.get('/all-recent-videos', PlaybackController.allRecentVideos);


module.exports = router;


