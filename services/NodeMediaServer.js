require('dotenv').config();

const NodeMediaServerController = require('../controllers/nodemediaserver_controller');
//const FileController = require('../controllers/file_controller');
const StreamController = require('../controllers/stream_controller');
//const aws = require('./AWS-SDK');

const User = require('../models/user');
const Video = require('../models/video');
const UserStream = require('../models/user_stream');
//const PlaybackLog = require('../models/playback_log');
var mongoose = require('mongoose');

const fs = require('fs');
const path = require('path');

const NodeMediaServer = require('node-media-server');

const hls_path = path.join(__dirname + '/../storage/users');

const config = {
    logType: 3,
    rtmp: {
        port: 1935,
        chunk_size: 4096,
        gop_cache: false,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: process.env.NODE_MEDIA_SERVER_HTTP_PORT || 8000,
        //mediaroot: 'E:/workspace/goblitz-backend/storage/users',
        mediaroot: hls_path,
        allow_origin: '*'
    },
    /*https: {
        port: 8443,
        key:'./privatekey.pem',
        cert:'./certificate.pem',
    },*/
    trans: {
        ffmpeg: process.env.FFMPEG_PATH,
        tasks: [
            {
                app: 'live',
                vc: "copy",
                vcParam: [],
                ac: "aac",
                acParam: ['-ab', '64k', '-ac', '1', '-ar', '44100'],
                //rtmp: true,
                //rtmpApp: 'live-ac',
                hls: true,
                hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
                //dash: false,
                //dashFlags: '[f=dash:window_size=3:extra_window_size=5]',
                mp4: true,
                mp4Flags: '[movflags=faststart]',
            }
        ]
    }
};

var video_data = {},
    audio_data = {},
    live = false,
    user_id = "",
    live_id = "",
    streamId = [],
    totalLiveViews = {},
    nms = new NodeMediaServer(config);


nms.on('preConnect', (id, args) => {
    console.log(`[pre connect-----------------------------1]`,);
});

nms.on('postConnect', (id, args) => {
    console.log(`[post connect-----------------------------2-----------${id}`);
    if (args.app === "live") {
        video_data = args;
        live_id = id;
    } else {
        audio_data = args;
    }
});

nms.on('doneConnect', async (id, args) => {
    console.log(`[done connect----------------------------9-----------${id}`);

    if (args.app === "live") {
        video_data = {};

        if (id === live_id) {
            let user = await User.find({_id: user_id});
            //const search_path = path.join(__dirname + '/../storage/users/live/' + user._id.toString());
            const search_path = path.join(__dirname + '/../storage/users/live/' + user[0].id);
            let video;

            let files = fs.readdirSync(search_path);
            // Handling error
            if (files.length === 0) {
                console.log('[No videos found] ');
            } else {
                await files.forEach(function (file) {
                    if (file.includes(".mp4")) {
                        video = file;
                    }
                });

                let data = {
                    name: "",
                    name_on_file: video,
                    owner: user[0].id,
                    username: user.username,
                    uploaded: 0   // adding 1 default
                };

                let res = await UserStream.findOne({user: mongoose.Types.ObjectId(user[0].id)})
                    .sort({updatedAt: -1}).limit(1);
                //console.log('res', res[0]);

                let update = {playbackUrl: process.env.EC2_URL + user[0].id + '/' + data.name_on_file};
                //console.log(update);
                let filter = {_id: res._id};

                let resp = await UserStream.findOneAndUpdate(filter, update, {new: true});
                //if (resp) console.log('[error while updating userstreams]');
                console.log('[updated userstreams]', resp);
                let videoResponse = await Video.create(data);
                console.log("[ added entry to video table ]", videoResponse);
                // if (err) {
                //     console.log();
                // } else {
                //     console.log("[ added entry to video table ]");
                // }
            }

            /*//to remove id from live_id
            console.log('[live_id before removed of id]', live_id);
            let index = live_id.indexOf(id);
            live_id.splice(index, 1);
            console.log('[live_id after removed of id]',live_id);*/


            // console.log(response);
            // console.log(response.startTime);

            /*Video.create(data, (err, response) => {
                if (err) {
                    console.log();
                } else {
                    console.log("[ added entry to video table ]");
                }
            });*/

            /*let data1 = {
                userStream:response.user,
                status:"",
                coverImage:response.coverImage,
                playbackUrl:

            }
            PlaybackLog.create(data1);*/

            //without upload to s3 and update video collection
            /*Video.create(data, (err, response) => {
                if (err) {
                    console.log();
                } else {
                    console.log("[ added entry to video table ]", response);
                    title = data.name_on_file;
                    //aws.upload(data.owner, title, data.name_on_file);
                    /!* Video.findOneAndUpdate({owner: bucket_id, name_on_file: file},
                         {$set: {uploaded: 1}},
                         {new: true},
                         (err, response) => {
                             if (err) console.log('[error While updating video model]');
                             console.log('[Updated video model]', response);
                         });*!/
                }
            });*/

            /*FileController.videoResolution({folder_id: user[0].id, movie: video}, (response) => {
                console.log('[videoResolution response ]', response);
            });*/
        }
    } else {
        audio_data = {};
    }
});

nms.on('prePublish', (id, StreamPath, args) => {
    console.log(`[pre publish--------------------------------3]`);
});

nms.on('postPublish', (id, StreamPath, args) => {
    console.log(`[post publish-----------------------------4`);

    live = true;
    user_id = StreamPath.split("/")[2];
    //streamId = id;
    StreamController.startStream(user_id, id);
    console.log("[===========================================================[4] BEFORE PUSH ==========]", streamId);
    streamId.push(id);
    console.log("[===========================================================[4] After PUSH ==========]", streamId);
    NodeMediaServerController.nodeMediaServerController('onPublish', {status: true, id: user_id}, function () {
    });
});

nms.on('prePlay', (id, StreamPath, args) => {
    console.log(`[pre play--------------------------5-----------${id}]`);
});

nms.on('postPlay', (id, StreamPath, args) => {
    console.log(`[post play----------------------------6------- ${id}]`);
    user_id = StreamPath.split("/")[2];

    //to increase totalLiveViews
    if (!totalLiveViews[user_id]) {
        console.log('[totalLiveViews=======]', totalLiveViews);
        totalLiveViews[user_id] = [];
        console.log('[totalLiveViews=======]', totalLiveViews);
    }

    totalLiveViews[user_id].push(id);
    console.log('[totalLiveViews======]', totalLiveViews);

    /*//to increase totalLiveViews
    if (!totalLiveViews.user_id) {
        totalLiveViews.user_id = user_id;
        console.log('[totalLiveViews=======]', totalLiveViews);
        totalLiveViews.user_id = [];
        console.log('[totalLiveViews.user_id======]', totalLiveViews.user_id);

    totalLiveViews[user_id].push(id);
    console.log('[totalLiveViews======]', totalLiveViews);
    console.log('[totalLiveViews.user_id======]', totalLiveViews.user_id);
    }*/

    //function to increase totalLiveViews
    StreamController.incLiveCount(user_id, (err, res) => {
        if (err) console.log("[error while increasing count of total live views]");
        console.log("[count increases of total live views]");
    });

});

nms.on('donePublish', (id, StreamPath, args) => {
    console.log(`[done publish----------------------------7-----------${id}`);

    live_id = id;  //for testing so which at the time of endstream it match with [ live_id === id ]

    user_id = StreamPath.split("/")[2];
    if (streamId.includes(id)) {
        console.log("[==========================================================[7]===========]", streamId);
        console.log("[id at the time of endStream ==========]", id);
        StreamController.endStream(user_id, id);
        let index = streamId.indexOf(id);
        streamId.splice(index, 1);
        if (totalLiveViews[user_id]) {
            console.log("[deleting totalLiveViews[user_id] =======]", totalLiveViews[user_id]);
            delete totalLiveViews[user_id];
            console.log("[deleted totalLiveViews  ========]", totalLiveViews);
        }
        console.log("[===========================================================[7] POP ==========]", streamId)
    }
    live = false;
    NodeMediaServerController.nodeMediaServerController('donePublish', {status: false, id: user_id}, function () {
    });
});

nms.on('donePlay', (id, StreamPath, args) => {
    console.log(`[done play-----------------------8--------------${id}`);

    // currentViews delete
    let uId = StreamPath.split("/")[2];
    //console.log(uId);
    console.log('[totalLiveViews========]', totalLiveViews);
    if (totalLiveViews.hasOwnProperty(uId)) {
        console.log('[totalLiveViews contain ====  ]', uId);

        if (totalLiveViews[user_id] && totalLiveViews[user_id].includes(id)) {
            let index = totalLiveViews[user_id].indexOf(id);
            console.log('[totalLiveViews========]', totalLiveViews);
            console.log('[ Before removing  totalLiveViews[user_id]========]', totalLiveViews[user_id]);
            totalLiveViews[user_id].splice(index, 1);
            console.log('[ After removed totalLiveViews[user_id]========]', totalLiveViews[user_id]);
            console.log('[totalLiveViews========]', totalLiveViews);
        }
    }

    /*    console.log('[totalLiveViews========]', totalLiveViews);
        console.log('[totalLiveViews[user_id]========]', totalLiveViews[user_id]);
        console.log('[totalLiveViews[user_id].includes(id)=====]', totalLiveViews[user_id].includes(id));*/

});

exports.runServer = function () {
    nms.run();
};

exports.getData = function (callback) {
    callback({
        streaming: live,
        video: video_data,
        audio: audio_data
    });
};

exports.watchingNow = totalLiveViews;
