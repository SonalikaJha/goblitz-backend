const Video = require('../models/video');
const User = require('../models/user');
const Game = require('../models/game');
const Helper = require('../config/helper');
const UserStream = require('../models/user_stream');
const Utils = require('../utils/utils');
const storage = require("../config/storage");
var mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

class StreamController {
    static async getRecentPlaybacks(req, res) {
        let username = req.params.username;
        let response = await User.findOne({username: username});
        let response1 = await Video.find({owner: (response._id).toString(), uploaded: 1}).sort({'updatedAt': -1});
        let result = [];
        response1.forEach((video) => {
            let obj = {
                id: video.name_on_file,
                link: process.env.EC2_URL + response._id + '/' + video.name_on_file,
                //link: process.env.CLOUDFRONT_URL + response._id + "/" + video.name_on_file,
                image: 'https://via.placeholder.com/360x200.jpg?text=Recommended+Channel',
                userProfile: 'https://via.placeholder.com/50/ff0000.jpg?text=DP',
                title: 'Title of the game!',
                userName: response.username,
                game: 'PUBG'
            };
            result.push(obj);
        });
        return Helper.main.response200(res, {result: result}, 'recent playbacks')
    }

    static getLiveStreamUrl(req, res) {
        let domain = process.env.SERVER_IP_ADDRESS + ':' + process.env.NODE_MEDIA_SERVER_HTTP_PORT;
        let url = "http://" + domain + "/live/" + req.user.id + ".flv";
        return Helper.main.response200(res, {url: url}, 'stream url');
    }

    static async getPlaybackUrl(req, res) {
        try {
            let response = await Video.findOne({name_on_file: req.params.videoId + '.mp4'});
            let url = process.env.EC2_URL + response.owner + '/' + req.params.videoId + '.mp4';

            let resp = await UserStream.findOne({playbackUrl: url});
            resp.totalPlaybackViews = resp.totalPlaybackViews + 1;

            let updatedPlaybackView = await UserStream.findOneAndUpdate({_id: resp._id},
                {totalPlaybackViews: resp.totalPlaybackViews}, {new: true, upsert: true});

            console.log('[playback view count  updated to =]', updatedPlaybackView.totalPlaybackViews);

            return Helper.main.response200(res, {url: url}, 'playback url')
        } catch (e) {
            console.log('e', e);
            return Helper.main.response500(res)
        }
    }

    static async getUserLiveStreamUrl(req, res) {
        let domain = process.env.SERVER_IP_ADDRESS + ':' + process.env.NODE_MEDIA_SERVER_HTTP_PORT;
        let username = req.params.username;
        let response = await User.findOne({username: username});
        let url = "http://" + domain + "/live/" + response.id + ".flv";
        return Helper.main.response200(res, {url: url}, 'User Live Stream Url');
    }

    static async editStreamInfo(req, res) {
        try {
            let userStream = {};
            userStream.gameTitle = req.body.gameTitle || '';
            userStream.gameDescription = req.body.gameDescription || '';
            if (req.body.tags) {
                userStream.tags = Utils.isJson(req.body.tags) ? JSON.parse(req.body.tags) : [];
            }
            if (req.body.gameId && req.body.gameId !== "") {
                let game = await Game.find({_id: req.body.gameId}).lean();
                userStream.game = game[0]._id;
            } else {
                userStream.game = undefined;
            }
            if (req.files && req.files.image) {
                let fileObject = Utils.getFileObject(req.files.image, 'streamCoverSD');
                await Utils.writeFile(fileObject.filePath, fileObject.file);
                userStream.coverImage = storage.streamCoverSD + fileObject.fileName
            }
            let response = await UserStream.findOneAndUpdate(
                {user: req.user.id, isLive: true}, userStream, {new: true, upsert: true}
            );
            console.log('response', response);
            return Helper.main.response200(res, response);
        } catch (e) {
            console.log(e);
            return Helper.main.response500(res)
        }
    }

    static async getStreamInfo(req, res) {
        try {
            let tags = [];
            let domain = process.env.SERVER_IP_ADDRESS + ':' + process.env.NODE_MEDIA_SERVER_HTTP_PORT;
            let response1 = await User.find({username: req.params.userName})
                .select('username profileImage isDeactive')
                .lean();
            console.log(response1);


            if (response1.length > 0) {

                if (response1[0].isDeactive) {
                    return res.status(422).json({
                        message: "Account is deactivated!",
                        errors: {account: ["Account is deactivated!"]}
                    });
                }

                let response = await UserStream.find({user: response1[0]._id, isLive: true})
                    .populate('tags', 'tag -_id')
                    .populate('game', 'title image -_id')
                    .lean();
                // .populate('user', 'username profileImage -_id')

                if (response.length > 0 && response[0].tags) {
                    response[0].tags.forEach((tag) => {
                        tags.push(tag.tag);
                    });
                    response[0].tags = tags;
                }

                // todo: add stream url to document when stream starts

                //response[0].streamUrl = "http://" + domain + "/live/" + req.user.id + ".flv";
                //console.log('response', response[0]);
                //let data = {userInfo: response1[0], streamInfo: response[0]};
                if (!response[0]) {
                    //console.log('[inside if----------------------======]', response1[0]);
                    return Helper.main.response200(res, {user: response1[0]}, 'stream-info');
                }
                response[0].user = response1[0];
                //console.log('[inside else----------------------======]', response[0]);
                return Helper.main.response200(res, response[0], 'stream-info');
            } else {
                return Helper.main.response404(res);
            }
        } catch (e) {
            console.log('e', e);
            return Helper.main.response500(res)
        }
    }

    static async startStream(userId, streamId) {
        console.log("[startstream id =======================]", streamId);
        let domain = process.env.SERVER_IP_ADDRESS + ':' + process.env.NODE_MEDIA_SERVER_HTTP_PORT;
        let user_Id = userId;
        let url = "http://" + domain + "/live/" + user_Id + ".flv";
        let hlsUrl = "http://" + domain + "/live/" + user_Id + "/index.m3u8";
        let startTime = new Date().toISOString();
        let response = await UserStream.findOne({user: user_Id}).sort({updatedAt: -1});
        if (response === null) {
            // UserStream.create({user: user_Id, startTime: startTime, streamOutputUrl: url, streamId: streamId});
            await UserStream.create({
                user: user_Id,
                startTime: startTime,
                streamOutputUrl: url,
                streamHlsUrl: hlsUrl,
                streamId: streamId,
                //game: "5e5d2b105979b448eef9a33f",
                //gameTitle: "playing",
                //gameDescription: "after a long day",
                //tags: ["5e57b0e4f1aac221b149f326", "5e57b0e4f1aac221b149f327"],
                isLive: true
            });
        } else {
            let data = {
                user: user_Id,
                game: response.game,
                gameTitle: response.gameTitle,
                gameDescription: response.gameDescription,
                tags: response.tags,
                coverImage: response.coverImage,
                streamOutputUrl: url,
                streamHlsUrl: hlsUrl,
                startTime: startTime,
                streamId: streamId,
                isLive: true
            };
            await UserStream.create(data);
        }
    }

    static async endStream(userId, streamId) {
        console.log("[endStream ======================]", streamId);
        let endTime = new Date().toISOString();
        //let response = await UserStream.findOne({user: userId, streamId: streamId}).sort({createdAt: -1});
        let response = await UserStream.findOne({user: userId}).sort({createdAt: -1});
        let cal = Math.abs(new Date(endTime) - new Date(response.startTime)) / 1000;
        let hours = Math.floor(cal / 3600) % 24;
        let minutes = Math.floor(cal / 60) % 60;
        let duration = hours + ' hrs : ' + minutes + ' min';
        let filter = {_id: response._id.toString()};
        let data = {duration: duration, endTime: endTime, isLive: false, totalPlaybackViews: response.totalLiveViews};
        await UserStream.findOneAndUpdate(filter, data);

        let user = await User.findOne({_id: userId});
        let newCount = user.videoCount + 1;
        let updateInfo = await User.findOneAndUpdate({_id: userId}, {videoCount: newCount}, {new: true});
        console.log('[videoCount updated ]', updateInfo.videoCount);
    }

    static async getLiveChannels(req, res) {
        try {
            const response = await UserStream.find({isLive: true})
                .select('-totalChatUsers -startTime -streamId -gameDescription -createdAt -updatedAt -duration -endTime')
                .populate('user').populate('game', 'title -_id');
            return Helper.main.response200(res, response, 'live-channels');
        } catch (e) {
            console.log('error', e);
            return Helper.main.response500(res);
        }

    }

    static async allChannels(req, res) {
        try {
            let users = [];
            let tags = [];
            const resp = await UserStream.distinct('user');
            for (let user in resp) {
                const respo = await UserStream.find({user: resp[user]}).sort({updatedAt: -1})
                    .select('-totalChatUsers -startTime -streamOutputUrl -streamId -gameDescription -createdAt -tags -updatedAt -duration -isLive -endTime')
                    .populate('user', 'username isDeactive -_id')
                    .populate('game', 'title -_id');

                //let usr=respo[0];
                //console.log(respo[0].user.isDeactive);
                if (respo[0].user != null) {
                    console.log("in not null");
                    if (!respo[0].user.isDeactive) {
                        console.log("in if");
                        users.push(respo[0]);
                    }
                }

            }
            console.log('users', users);

            // for (let user in users) {
            //     tags = [];
            //     if (users[user].length > 0 && users[user].tags) {
            //         users[user].tags.forEach((tag) => {
            //             tags.push(tag.tag);
            //         });
            //         users[user].tags = tags;
            //     }
            // }
            return Helper.main.response200(res, users, 'all-channels');
        } catch (e) {
            console.log('error', e);
            return Helper.main.response500(res);
        }
    }

    static async search(req, res) {

        console.log("search", req.body.searchText);
        let options = {};
        let regex = new RegExp('(' + req.body.searchText + ')');
        options["$or"] = [
            {gameTitle: regex},
            {gameDescription: regex}
        ];
        let option1 = {
            isLive: false,
            totalPlaybackViews: {$exists: true}
        };
        option1["$or"] = [
            {title: regex},
            {description: regex}

        ];
        let option2 = {};
        option2["$or"] = [
            {name: regex},
            {description: regex}
        ];
        const response = {};
        response.liveChannels = [];
        response.games = [];
        response.videos = [];

        try {
            const response1 = await UserStream.find(options).sort({totalLiveViews: -1})
                .populate('user')
                .populate('game')
                .populate('tags')
                .lean();

            let channels = _.map(response1, (channel) => {
                let tags = [];
                if (channel.tags && channel.tags.length > 0) {
                    tags = _.map(channel.tags, (tag) => {
                        return tag.tag;
                    });
                    channel.tags = tags;
                }
                return new LiveChannelsResponseConstructor(channel);
            });

            let response = await UserStream.find(option1)
                .sort({totalPlaybackViews: -1})
                .populate('user')
                .populate('game')
                .populate('tags')
                .lean();

            let videos = response.map(recentBroadcast => {
                let tags = [];
                if (recentBroadcast.tags && recentBroadcast.tags.length > 0) {
                    tags = _.map(recentBroadcast.tags, (tag) => {
                        return tag.tag;
                    });
                    recentBroadcast.tags = tags;
                }
                return new RecentBroadcastConstructor(recentBroadcast)
            });

            const response2 = await Game.find(option1);

            response.videos = videos;
            response.liveChannels = channels;
            response.games = response2;


            return Helper.main.response200(res, response, 'search-data');
        } catch (e) {
            console.log('error', e);
            return Helper.main.response500(res);
        }
    }

    static async getLatestStream(req, res) {
        try {
            let response = await UserStream.find({isLive: true}).sort({totalLiveViews: -1})
                .populate('user', 'username profileImage _id')
                .populate('game', 'title image -_id');

            console.log(response);
            let users = await User.find({isDeactive: true});
            let data = [];
            response.forEach(r => {

                let isIn = false;
                if (r.user != null) {
                    users.forEach(u => {
                        console.log("checked", r.user._id, u.id);
                        if (r.user._id == u.id) {
                            console.log("Its true", u.id);
                            isIn = true;
                        }

                    });
                    if (!isIn) {
                        data.push(r);
                    }
                }


            });

            console.log("data", data);

            data.forEach(d => {
                console.log("isDeactive", d.user.isDeactive);
            });

            return Helper.main.response200(res, data[0], 'latest channel');
        } catch (e) {
            console.log('error', e);
            return Helper.main.response500(res);
        }
    }

    static async incLiveCount(user_id, callback) {
        let response = await UserStream.findOne({
            user: mongoose.Types.ObjectId(user_id),
            isLive: true
        }).sort({updatedAt: -1});
        let count = response.totalLiveViews + 1;
        let resp = await UserStream.findOneAndUpdate({_id: response._id}, {totalLiveViews: count});
        callback(undefined, resp);
    }

    static async updateStreamInfo(req, res) {
        try {
            let streamId = req.params.userStreamId;
            console.log('[streamId]', streamId);
            let stream = await UserStream.findOne({_id: streamId});
            console.log('[stream]', stream);
            let userStream = {};
            userStream.gameTitle = req.body.gameTitle || '';
            userStream.gameDescription = req.body.gameDescription || '';
            if (req.body.tags) {
                userStream.tags = Utils.isJson(req.body.tags) ? JSON.parse(req.body.tags) : [];
            }
            if (req.body.gameId && req.body.gameId !== "") {
                let game = await Game.find({_id: req.body.gameId}).lean();
                userStream.game = game[0]._id;
            } else {
                userStream.game = undefined;
            }
            if (req.files && req.files.image) {
                let fileObject = Utils.getFileObject(req.files.image, 'streamCoverSD');
                await Utils.writeFile(fileObject.filePath, fileObject.file);
                userStream.coverImage = storage.streamCoverSD + fileObject.fileName
            }

            let response = await UserStream.findOneAndUpdate(
                {_id: stream._id}, userStream, {new: true, upsert: true}
            );

            console.log('response', response);
            return Helper.main.response200(res, response);
        } catch (e) {
            console.log(e);
            return Helper.main.response500(res)
        }
    }

    static async incPlaybackCount(req, res) {
        let streamId = req.params.streamId;
        try {
            let resp = await UserStream.findOne({streamId: streamId});
            if (resp == null) {
                return Helper.main.response200(res, '', 'invalid params');
            }
            resp.totalPlaybackViews = resp.totalPlaybackViews + 1;
            let response = await UserStream.findOneAndUpdate({streamId: streamId}, {totalPlaybackViews: resp.totalPlaybackViews},
                {new: true, upsert: true});
            console.log('[response of increase count of playbackUrl]', response);
            return Helper.main.response200(res, response);
        } catch (e) {
            console.log(e);
            return Helper.main.response500(res);
        }
    }

    static async removeVideo(req, res) {
        let videoId = req.params.videoId;
        let userId = req.user.id;

        try {
            let video = await Video.findOne({name_on_file: videoId + '.mp4'});
            let url = process.env.EC2_URL + userId + '/' + videoId + '.mp4';
            let streamData = await UserStream.findOne({playbackUrl: url});

            //to check video available at location
            let dir = path.join(__dirname + '/../storage/users/live/' + userId + '/' + videoId + '.mp4');
            let fileStatus = fs.existsSync(dir);
            if (video == null || streamData == null || fileStatus === false) {
                return Helper.main.response200(res, '', 'something wrong with file');
            } else {
                //delete file from directory and video and userstream
                fs.unlinkSync(dir);
                console.log('[deleted from ec2]');
                let delVideo = await Video.deleteOne({name_on_file: videoId + '.mp4'});
                console.log('[delVideo response]', delVideo);
                let delUserStream = await UserStream.deleteOne({playbackUrl: url});
                console.log('[delUserStream response]', delUserStream);

                //after deleting reduce count of videoCount from user table
                let user = await User.findOne({_id: userId});
                user.videoCount = user.videoCount - 1;
                let delResp = await User.findOneAndUpdate({_id: user._id}, {videoCount: user.videoCount}, {new: true});
                console.log('[videoCount reduce from user table]', delResp.videoCount);

                return Helper.main.response200(res, '', 'removed');
            }
        } catch (e) {
            console.log(e);
            return Helper.main.response500(res);
        }
    }

    static async addVideoCount(req, res) {
        try {
            let streams = await UserStream.find({playbackUrl: {$exists: true}});

            for (let i = 0; i < streams.length; i++) {
                let user = await User.findOne({_id: streams[i].user});
                let count = user.videoCount + 1;
                console.log(count);
                let resp = await User.findOneAndUpdate({_id: user.id}, {videoCount: count}, {new: true});
                console.log(`count is ${resp.videoCount} and response is ${resp}`);
            }
            return Helper.main.response200(res);
        } catch (e) {
            console.log(e);
            return Helper.main.response500(res);
        }
    }

    static async add_TotalLiveViews_to_totalPlaybackViews(req, res) {
        try {
            let response = await UserStream.find({isLive: false, totalLiveViews: {$exists: true}});

            for (let i = 0; i < response.length; i++) {
                console.log(`${response[i].totalLiveViews} totalLiveViews`);
                console.log(`${response[i].totalPlaybackViews} totalPlaybackViews`);

                response[i].totalPlaybackViews = response[i].totalPlaybackViews + response[i].totalLiveViews;
                let updateResp = await UserStream.findOneAndUpdate({_id: response[i]._id},
                    {totalPlaybackViews: response[i].totalPlaybackViews}, {new: true});
                console.log(`${updateResp.totalPlaybackViews} totalPlaybackViews after update`);
            }
            return Helper.main.response200(res);
        } catch (e) {
            console.log(e);
            return Helper.main.response500(res);
        }
    }

    static async updateViews() {
        try {
            let streams = await UserStream.find({isLive: false}).populate('game');
            // console.log("streams::",streams);
            let games = await Game.find();
            for (const game of games) {
                let count = 0;
                streams.forEach(stream => {
                    if (stream.game != null) {
                        if (stream.game.title === game.title) {
                            //console.log("stream",stream);
                            count = count + stream.totalPlaybackViews;
                        }
                    }
                });
                if (count > 0) {
                    console.log("before update", game);
                    let g = await Game.findOneAndUpdate({_id: game._id}, {viewersCount: count});
                    console.log("after updated values", g);
                }
            }
        } catch (e) {
            console.log(e);

        }
        // Schedular
    }

}

schedule.scheduleJob('0 0 4 * * *', function () {
    console.log('updateViews scheduler is suppose to run at ', new Date());
    StreamController.updateViews();
});

module.exports = StreamController;
