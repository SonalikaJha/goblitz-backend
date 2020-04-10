const fs = require('fs');
const path = require('path');
const ffmpeg = require('ffmpeg');
const aws = require('../services/AWS-SDK');

class FileController {
    static getFileNames(fileNames, folder_id) {
        const search_path = path.join(__dirname + '/../storage/users/live/' + folder_id);
        const videos = [];

        fs.readdir(search_path, (err, files) => {
            if (err) {
                return '[No videos found]'
            } else {
                files.forEach(function (file) {
                    videos.push(file);
                });
                return videos
            }
        });
    }

    static getLastCreatedFile(folder_id) {
        const search_path = path.join(__dirname + '/../storage/users/live/' + folder_id);
        let video;

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

                return video;
            }
        });
    }

    static checkIndexFiles(folder_id) {
        const search_path = path.join(__dirname + '/../storage/users/live/' + folder_id);
        const videos = [];

        fs.readdir(search_path, (err, files) => {
            // Handling error
            if (err) {
                callback('[No videos found] ' + err);

            } else {
                files.forEach(function (file) {
                    videos.push(file);
                });

                return videos;
            }
        });
    }

    static remove(data) {
        var movie_orig = path.join(__dirname + '/../storage/users/live/' + data.folder_id + '/' + data.movie);
        var movie_480 = path.join(__dirname + '/../storage/users/live_480p/' + data.folder_id + '/' + data.movie);

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
    }

    static createFolder480(data) {
        var dir = path.join(__dirname + '/../storage/users/live_480p/' + data.id);

        if (!fs.existsSync(dir)) {
            fs.mkdir(dir, { recursive: true },function (err) {
                if (err) {
                    console.log(`[Error] ${err}`);
                } else {
                    console.log(`[Folder Created] ${dir}`);
                }
            });
        } else
        console.log(`[Folder Already Exist] ${dir}`);
    }

    static videoResolution(data, callback) {
        var search_path = path.join(__dirname + '/../storage/users/live/' + data.folder_id + '/' + data.movie);
        this.createFolder480({id: data.folder_id});
        var save_path = path.join(__dirname + '/../storage/users/live_480p/' + data.folder_id + '/' + data.movie);
        try {
            new ffmpeg(search_path, function (error, video) {
                if (error) {
                    callback(error);

                } else {
                    setTimeout(function () {
                        video.addCommand('-analyzeduration', '2147483647');
                        video.addCommand('-probesize', '2147483647');
                        video.addCommand('-max_muxing_queue_size', '9999');
                        video.addCommand('-c:v', 'libx264');
                        video.addCommand('-vf', 'scale=854:480');

                        video.save(save_path, function (err, file) {
                            if (err) {
                                callback(`[Conversion Error] ${err}`);

                            } else {
                                callback(`[Conversion Success] ${file}`);
                                // upload to Amazon S3 after conversion
                                //awsController('uploadVideo', { id: data.folder_id, title: data.movie, file: data.movie });
                                aws.upload(data.folder_id, data.movie, data.movie);
                        }
                        });
                    }, 10000);
                }
            });
        } catch (error) {
            callback(`[${error.code}] ${error.msg}`);
        }
    }
}

module.exports = FileController;
