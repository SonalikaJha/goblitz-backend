const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const Video = require('../models/video');

//const {videoController} = require('./NodeMediaServer');

//var app = require('../app');

AWS.config = {
    "region": "us-east-1",
    "accessKeyId": "AKIAJTTEZVHL3P3TADJQ",
    "secretAccessKey": "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"
};

// var myCredentials = new AWS.CognitoIdentityCredentials({
//     IdentityPoolId: 'us-east-1:1699ebc0-7900-4099-b910-2df94f52a030'
// });

// AWS.config.update({
//     credentials: myCredentials
// });

var s3 = new AWS.S3(),
    s3Stream = require('s3-upload-stream')(new AWS.S3());

exports.listBuckets = function (callback) {
    // Call S3 to list the buckets
    s3.listBuckets(function (err, data) {
        if (err) {
            callback("[Error]", err);
        } else {
            callback("[Success]", data.Buckets);
        }
    });
};

exports.createBucket = function (bucket_name) {
    // call S3 to create the bucket
    s3.createBucket({Bucket: bucket_name}, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data.Location);
        }
    });
};

exports.upload = function (bucket_id, title, file) {
    //var read = fs.createReadStream("./storage/users/live_480p/" + bucket_id + "/" + file);
    var read = fs.createReadStream("./storage/users/live/" + bucket_id + "/" + file);
    var object_dir = bucket_id + "/" + title;

    var upload = s3Stream.upload({
        Bucket: "video-streaming-application",
        Key: object_dir,
        ACL: "public-read"
    });

    upload.maxPartSize(5242880); // 5 MB

    upload.on('error', function (error) {
        console.log(error);
    });

    upload.on('part', function (details) {
        console.log(details);
    });

    upload.on('uploaded', function (details) {
        console.log(details);

        Video.findOneAndUpdate({owner: bucket_id, name_on_file: file},
            {$set: {uploaded: 1}},
            {new: true},
            (err, response) => {
                if (err) console.log('[error While updating video model]');
                console.log('[Updated video model]', response);
            });

        // videoController('update', {owner: bucket_id, name_on_file: file}, function (response) {
        //     console.log(response);
        // });

        // undo for 480p
        /*Video.findOneAndUpdate({
            owner: bucket_id,
            name_on_file: file },
            {$set: {uploaded: 1}},
            {new: true},
            (err, response) => {
            if (err) console.log('[error While updating video model]');
            console.log('[Updated video model]', response);
        });
        //FileController.remove({ folder_id: bucket_id, movie: file });

        const movie_orig = path.join(__dirname + '/../storage/users/live/' + bucket_id + '/' + file);
        const movie_480 = path.join(__dirname + '/../storage/users/live_480p/' + bucket_id + '/' + file);

        fs.unlink(movie_orig, function (err) {
            if (err) {
                console.log("[Error]");
                console.log(err);
            } else {
                console.log("[File Deleted]");
                console.log(movie_orig);
            }
        });

        fs.unlink(movie_480, function (err) {
            if (err) {
                console.log("[Error]");
                console.log(err);
            } else {
                console.log("[File Deleted]");
                console.log(movie_480);
            }
        });
    });*/
    });
    read.pipe(upload);
}
