const _ = require('underscore');
const User = require('../models/user');
const Utils = require('../utils/utils');
const Helper = require('../config/helper');
const RecentBroadcastConstructor = require('../constructors/recent_broadcast');
const UserStreams = require('../models/user_stream');


class PlaybackController {

    static async recentBroadcast(req, res) {

        let users = await User.find({isDeactive: true});

        let response = await UserStreams.find({
            isLive: false,
            totalPlaybackViews: {$exists: true},
            playbackUrl: {$exists: true}
        })
            .sort({totalPlaybackViews: -1})
            .populate('user')
            .populate('game')
            .populate('tags')
            .lean();


        let data = [];
        response.forEach(r => {
            let isIn = false;
            if (r.user != null) {
                users.forEach(u => {
                    //console.log("checked", r.user._id, u.id);
                    if (r.user._id == u.id) {
                        //console.log("Its true", u.id);
                        isIn = true;
                    }
                });
                if (!isIn) {
                    data.push(r);
                }
            }
        });
        //console.log("data", data);

        // data.forEach(d => {
        //     console.log("isDeactive", d.user.isDeactive);
        // });


        let result = data.map(recentBroadcast => {
            let tags = [];
            if (recentBroadcast.tags && recentBroadcast.tags.length > 0) {
                tags = _.map(recentBroadcast.tags, (tag) => {
                    return tag.tag;
                });
                recentBroadcast.tags = tags;
            }
            if (recentBroadcast.playbackUrl) {
                let res = recentBroadcast.playbackUrl.split('/');
                res = res.slice(-1).pop();
                res = res.split('.');
                recentBroadcast.playbackId = res[0];
            }
            return new RecentBroadcastConstructor(recentBroadcast)
        });

        return Helper.main.response200(res, result, 'recent broadcast');
    }

    static async channelVideoList(req, res) {
        let userName = req.params.username;
        let user = await User.findOne({username: userName, isDeactive: false});

        if (user == null) {
            return Helper.main.response200(res, [], 'User is deactivated.');
        }

        let response = await UserStreams.find({user: user._id, isLive: false})
            .sort({endTime: -1})
            .populate('user')
            .populate('game')
            .populate('tags')
            .lean();

        let result = response.map(recentBroadcast => {
            let tags = [];
            if (recentBroadcast.tags && recentBroadcast.tags.length > 0) {
                tags = _.map(recentBroadcast.tags, (tag) => {
                    return tag.tag;
                });
                recentBroadcast.tags = tags;
            }
            if (recentBroadcast.playbackUrl) {
                let res = recentBroadcast.playbackUrl.split('/');
                res = res.slice(-1).pop();
                res = res.split('.');
                recentBroadcast.playbackId = res[0];
            }
            return new RecentBroadcastConstructor(recentBroadcast)
        });

        return Helper.main.response200(res, result, 'channel Video List');
    }

    static async allRecentVideos(req, res) {
        try {
            let response = await UserStreams.find({isLive: false, playbackUrl: {$exists: true}})
                .sort({endTime: -1})
                .populate('user')
                .populate('game')
                .populate('tags')
                .lean();

            let users = await User.find({isDeactive: true});
            let data = [];
            response.forEach(r => {

                let isIn = false;
                if (r.user != null) {
                    users.forEach(u => {
                        //console.log("checked", r.user._id, u.id);
                        if (r.user._id == u.id) {
                            //console.log("Its true", u.id);
                            isIn = true;
                        }

                    });
                    if (!isIn) {
                        data.push(r);
                    }
                }
            });
            //console.log("data", data);

            // data.forEach(d => {
            //     console.log("isDeactive", d.user.isDeactive);
            // });

            let result = data.map(recentBroadcast => {
                let tags = [];
                if (recentBroadcast.tags && recentBroadcast.tags.length > 0) {
                    tags = _.map(recentBroadcast.tags, (tag) => {
                        return tag.tag;
                    });
                    recentBroadcast.tags = tags;
                }
                if (recentBroadcast.playbackUrl) {
                    let res = recentBroadcast.playbackUrl.split('/');
                    res = res.slice(-1).pop();
                    res = res.split('.');
                    recentBroadcast.playbackId = res[0];
                }
                return new RecentBroadcastConstructor(recentBroadcast);
            });

            return Helper.main.response200(res, result, 'all recent videos');
        } catch (e) {
            console.log(e);
            return Helper.main.response500(res);
        }
    }
}

module.exports = PlaybackController;
