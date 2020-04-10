const _ = require('underscore');
const Users = require('../models/user');
const Utils = require('../utils/utils');
const Helper = require('../config/helper');
const AllChannelsResponseConstructor = require('../constructors/all_channel');
const LiveChannelsResponseConstructor = require('../constructors/live_channel');
const UserStreams = require('../models/user_stream');
const ChannelUserFollower = require('../models/channel_user_follower');

class ChannelController {

    static async getRecommendedChannels(req, res) {
        let channels = [];
        let users = [];
        try {
            let resp = await UserStreams.distinct("user");
            for (let user in resp) {
                let response = await Users.find({_id: resp[user], isDeactive: false});
                if (response.length > 0)
                    users.push(response);
            }

            if (users.length > 0) {
                for (let user in users) {
                    let response = await Utils.getLatestStream(users[user]);
                    if (await Utils.getLatestStream(users[user])) {
                        channels.push(response);
                    }
                }
            }
            return Helper.main.response200(res, channels, 'recommended channels');
        } catch (e) {
            console.log('error', e);
            return Helper.main.response500(res);
        }
    }

    static async liveChannels(req, res) {
        let response = await UserStreams.find({isLive: true})
            .sort({totalLiveViews: -1})
            .populate('user')
            .populate('game')
            .populate('tags')
            .lean();

        let users = await Users.find({isDeactive: true});
        let data = [];
        response.forEach(r => {

            let isIn = false;
            if (r.user != null) {
                users.forEach(u => {
                    //console.log("checked",r.user._id,u.id);
                    if (r.user._id == u.id) {
                        //console.log("Its true",u.id);
                        isIn = true;
                    }

                });
                if (!isIn) {
                    data.push(r);
                }
            }
        });

        // console.log("data",data);
        // data.forEach( d=> {
        //      console.log("isDeactive",d.user.isDeactive);
        // });

        let channels = _.map(data, (channel) => {
            let tags = [];
            if (channel.tags && channel.tags.length > 0) {
                tags = _.map(channel.tags, (tag) => {
                    return tag.tag;
                });
                channel.tags = tags;
            }
            return new LiveChannelsResponseConstructor(channel);
        });

        return Helper.main.response200(res, channels, 'live channels')
    }

    static async allChannels(req, res) {
        let userIds = await UserStreams.find().distinct('user');
        let users = await Users.find({isDeactive: true});
        let data = [];
        userIds.forEach(userId => {
            let isIn = false;
            users.forEach(user => {
                if (user.id == userId) {
                    isIn = true;
                }
            });
            if (!isIn) {
                data.push(userId);
            }
        });

        //console.log(userIds);
        //console.log(data);
        let streams = await data.map(async userId => {
            return ChannelController.getStream(userId)
        });

        let result = await Promise.all(streams);
        result.sort((a, b) => {
            return b.viewersCount - a.viewersCount
        });
        return Helper.main.response200(res, result, 'all channels');
    }

    static getStream(userId) {
        return new Promise((resolve, reject) => {
            UserStreams.find({user: userId, totalPlaybackViews: {$exists: true}})
                //.sort({viewersCount: -1})
                .populate('user')
                .populate('game')
                .populate('tags')
                .lean()
                .then(response => {
                    let stream = response[0];
                    let tags = [];
                    if (stream && stream.tags && stream.tags.length > 0) {
                        tags = _.map(stream.tags, (tag) => {
                            return tag.tag;
                        });
                        stream.tags = tags;
                    }
                    resolve(new AllChannelsResponseConstructor(stream))
                })
        });
    }

    static async getChannelFollowerList(req, res) {
        //let response = await Users.findOne(req.user.id);
        let userName = req.params.username;
        try {
            let response = await Users.findOne({username: userName});
            if (response === null) {
                return Helper.main.response404(res);
            }
            if (response.isDeactive) {
                return res.status(422).json({
                    message: "Account is deactivated!",
                    errors: {account: ["Account is deactivated!"]}
                });
            }
            let followers = await ChannelUserFollower.find({channel: response.id, isFollowed: true})
                .populate('user').lean();

            if (!followers || followers.length === 0) {
                return Helper.main.response200(res, followers, 'Currently No followers');
            }
            return Helper.main.response200(res, followers, `${followers.length} followers`);
        } catch (e) {
            console.log(e);
            return Helper.main.response500(res);
        }
    }

    static async setChannelFollow(req, res) {
        let userName = req.params.username;
        try {
            let response = await Users.findOne({username: userName});
            let userStatus = await ChannelUserFollower.findOne({channel: response.id, user: req.user.id}).lean();
            if (userStatus == null) {
                let data = {
                    channel: response.id,
                    user: req.user.id,
                    isFollowed: true,
                    ipAddress: req.connection.remoteAddress
                };
                let response1 = await ChannelUserFollower.create(data);

                //to increase follower count in user
                let user = await Users.findOne({_id: response._id});
                user.followersCount = user.followersCount + 1;
                let resData = await Users.updateOne({_id: user._id}, {$set: {followersCount: user.followersCount}});

                console.log(response1);
                return Helper.main.response200(res, response1);
            } else {
                if (userStatus.isFollowed) {
                    console.log(userStatus);
                    return Helper.main.response200(res, userStatus, 'user is already following');
                } else {
                    let filter = {channel: response.id, user: req.user.id};
                    let data = {isFollowed: true, ipAddress: req.connection.remoteAddress};
                    let resp = await ChannelUserFollower.findOneAndUpdate(filter, data, {
                        new: true, upsert: true
                    }).lean();

                    //to increase follower count in user
                    let user = await Users.findOne({_id: response._id});
                    user.followersCount = user.followersCount + 1;
                    let resData = await Users.updateOne({_id: user._id}, {$set: {followersCount: user.followersCount}});

                    return Helper.main.response200(res, resp, 'ok');
                }
            }
        } catch (e) {
            console.log(e);
            return Helper.main.response500(res)
        }
    }

    static async setChannelUnfollow(req, res) {
        let userName = req.params.username;
        try {
            let response = await Users.findOne({username: userName});
            let userFollow = await ChannelUserFollower.findOne({channel: response.id, user: req.user.id});
            if (userFollow == null) {
                return Helper.main.response500(res)
            } else if (userFollow.isFollowed) {
                let filter = {channel: response.id, user: req.user.id};
                let data = {
                    isFollowed: false,
                    ipAddress: req.connection.remoteAddress
                };
                let response1 = await ChannelUserFollower.findOneAndUpdate(filter, data, {
                    new: true,
                    upsert: true
                }).lean();

                //to decrease follower count in user
                let user = await Users.findOne({_id: response._id});
                user.followersCount = user.followersCount - 1;
                let resData = await Users.updateOne({_id: response._id}, {$set: {followersCount: user.followersCount}});

                console.log(response1);
                return Helper.main.response200(res, response1);
            } else {
                console.log(userFollow);
                return Helper.main.response200(res, userFollow, 'user is already unfollowed');
            }
        } catch (e) {
            console.log(e);
            return Helper.main.response500(res)
        }
    }

    static async getChannelStatus(req, res) {
        let userName = req.params.username;
        try {
            let response = await Users.findOne({username: userName});
            let userFollow = await ChannelUserFollower.findOne({channel: response.id, user: req.user.id});
            if (userFollow == null) {
                return Helper.main.response200(res, 'false', 'status');
            } else {
                if (userFollow.isFollowed) {
                    return Helper.main.response200(res, 'true', 'status');
                } else {
                    return Helper.main.response200(res, 'false', 'status');
                }
            }
        } catch (e) {
            console.log(e);
            return Helper.main.response500(res)
        }
    }

    static async correctFollowerCount(req, res) {
        try {
            let resp = await Users.updateMany({}, {$set: {followersCount: 0}});
            console.log(resp);

            let data = await ChannelUserFollower.find({isFollowed: true});

            for (let i = 0; i < data.length; i++) {
                let temp = await Users.findOne({_id: data[i].channel});
                console.log(` before update  followerCount is ${temp.followersCount}`);

                temp.followersCount = temp.followersCount + 1;
                let response = await Users.updateOne({_id: temp._id}, {$set: {followersCount: temp.followersCount}});
                console.log(' after update  followerCount status is', response);
            }
            return Helper.main.response200(res);
        } catch (e) {
            console.log(e);
            return Helper.main.response500(res)
        }
    }

    static async getfollowings(req, res) {
        try {
            let userId = req.user.id;
            let followings = await ChannelUserFollower.find({user: userId, isFollowed: true})
                .select('-isFollowed -ipAddress -createdAt -updatedAt -__v -_id -user')
                .populate('channel', 'username profileImage followersCount')
                .lean();
            //.populate('channel','-email -password -dob -coverImage -bio -isActive -country -videoCount -viewersCount -isDeactive')
            return Helper.main.response200(res, followings);
        } catch (e) {
            console.log(e);
            return Helper.main.response500(res);
        }
    }
}

module.exports = ChannelController;