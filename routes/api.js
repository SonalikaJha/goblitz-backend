const express = require('express');
const router = express.Router();
const Helper = require('../config/helper');

const AuthMiddleware = require('../middlewares/auth_middleware');

const AuthController = require('../controllers/auth_controller');
const StreamController = require('../controllers/stream_controller');
const UserController = require('../controllers/user_controller');
const GameController = require('../controllers/game_controller');
const TagController = require('../controllers/tag_controller');
const ChannelController = require('../controllers/channel_controller');

/* GET home page. */
router.get('/', function (req, res, next) {
    return res.json({});
});
// Authentication Routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/forget-password',AuthController.forgetPassword);
router.post('/update-password',AuthController.updatePassword);
router.post('/activate-account',AuthController.activateAccount);
router.post('/deactivate-account',AuthMiddleware, AuthController.deactivateAccount);

// Authenticated routes
router.get('/profile', AuthMiddleware, AuthController.profile);

router.get('/auth/stream', function (req, res, next) {
    return res.json({}).status(200);
});
router.get('/get-obs-settings', AuthMiddleware, function (req, res) {
    let domain = process.env.SERVER_IP_ADDRESS;
    let url = "rtmp://" + domain + "/live";
    let stream_key = req.user.id;
    return Helper.main.response200(res, {url, stream_key}, 'obs-settings')
});

router.get('/recent-playbacks/:username', StreamController.getRecentPlaybacks);

router.get('/live-stream', AuthMiddleware, StreamController.getLiveStreamUrl);

router.get('/playback-url/:videoId', StreamController.getPlaybackUrl);

router.get('/live-user-stream/:username', StreamController.getUserLiveStreamUrl);

// user-profile Routes

router.get('/user-profile', AuthMiddleware, UserController.getUserProfile);
router.post('/update-user-profile', AuthMiddleware, UserController.editUserProfile);
router.post('/update-profile-image', AuthMiddleware, UserController.editProfileImage);
router.post('/update-cover-image', AuthMiddleware, UserController.editCoverImage);

// stream Routes
//router.get('/get-stream-info/:userName', AuthMiddleware, StreamController.getStreamInfo);
router.get('/get-stream-info/:userName', StreamController.getStreamInfo);
router.put('/update-stream-info', AuthMiddleware, StreamController.editStreamInfo);
router.get('/live-channels', StreamController.getLiveChannels);
router.get('/all-channels', StreamController.allChannels);
router.get('/latest-stream', StreamController.getLatestStream);
router.put('/update-stream-info/:userStreamId', AuthMiddleware, StreamController.updateStreamInfo);
router.get('/playback-count/:streamId', StreamController.incPlaybackCount);
router.get('/delete-stream/:videoId', AuthMiddleware, StreamController.removeVideo);




router.post('/search', StreamController.search);

// Game routes

router.get('/game', GameController.getAll);
router.post('/game', GameController.create);
router.post('/game-title', GameController.getById);
router.post('/follower-count', AuthMiddleware, GameController.updateFollowers);
router.post('/unfollower-count', AuthMiddleware, GameController.unfollow);
router.post('/follower-status', AuthMiddleware, GameController.followStatus);
router.get('/field-add', GameController.addFollowersCount);

// Tags routes

router.get('/tag', TagController.getAll);
router.post('/tag', TagController.create);
router.get('/watching-now/:userId', TagController.watchingNow);
router.post('/inactive-tag', TagController.setInActive);
router.post('/active-tag', TagController.setActive);

router.post('/active-singletag', AuthMiddleware, TagController.setSingleActive);
router.get('/inactiveTag-list',TagController.getAllInactiveTag);
router.get('/activeTag-list',TagController.getAllactiveTag);
// channel Controller

router.get('/recommended-channels', ChannelController.getRecommendedChannels);
router.get('/channel-follower/:username', ChannelController.getChannelFollowerList);
router.get('/channel-follow/:username', AuthMiddleware, ChannelController.setChannelFollow);
router.get('/channel-unfollow/:username', AuthMiddleware, ChannelController.setChannelUnfollow);
router.get('/channel-status/:username', AuthMiddleware, ChannelController.getChannelStatus);
router.get('/channel-following', AuthMiddleware, ChannelController.getfollowings);


//temp api to add videoCount just Run once
router.get('/temp-api-videoCount', StreamController.addVideoCount);
//add more which makes totalPlaybackViews = totalLiveViews just Run once
router.get('/temp-api-totalPlaybackViews', StreamController.add_TotalLiveViews_to_totalPlaybackViews);
//add more which makes followerCount correct just Run once
router.get('/temp-api-followerCount', ChannelController.correctFollowerCount);


module.exports = router;
