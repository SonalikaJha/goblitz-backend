const fs = require('fs');
const path = require('path');

exports.getFileNames = function (folder_id, callback) {
    var search_path = path.join(__dirname + '/../storage/users/live/' + folder_id);
    var videos = [];

    fs.readdir(search_path, (err, files) => {
        // Handling error
        if (err) {
            callback('[No videos found] ' + err);

        } else {
            files.forEach(function (file) {
                videos.push(file);
            });

            callback(videos);
        }
    });
}

exports.getLastCreatedFile = function (folder_id, callback) {
    var search_path = path.join(__dirname + '/../storage/users/live/' + folder_id);
    var video;

    fs.readdir(search_path, (err, files) => {
        // Handling error
        if (err) {
            callback('[No videos found] ' + err);

        } else {
            files.forEach(function (file) {
                if (file.includes(".mp4")) {
                    video = file;
                }
            });

            callback(video);
        }
    });
}

exports.checkIndexFiles = function (folder_id, callback) {
    var search_path = path.join(__dirname + '/../storage/users/live/' + folder_id);
    var videos = [];

    fs.readdir(search_path, (err, files) => {
        // Handling error
        if (err) {
            callback('[No videos found] ' + err);

        } else {
            files.forEach(function (file) {
                videos.push(file);
            });

            callback(videos);
        }
    });
}