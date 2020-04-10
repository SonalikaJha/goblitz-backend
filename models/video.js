const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    name_on_file: {
        type: String,
        trim: true
    },
    username: {
        type: String,
        trim: true
    },
    uploaded: {
        type: Number,
        default: 0
    },
    owner: {
        type: String
    }
    },
    {
    timestamps: true
    }
);

module.exports = mongoose.model('Video', videoSchema);

// exports.getAllByUserId = function (user_id, callback) {
 //    Video.find({ owner: user_id }, function (error, videos) {
  //      callback(videos);
   //  });
// }
//
// exports.getAllByUsername = function (username, callback) {
//     Video.find({ username: username }, function (error, videos) {
//         callback(videos);
//     });
// }
//
// exports.getById = function () {
//
// }
//
// exports.add = function (data, callback) {
//     var video = new Video(data);
//     video.save()
//         .then((item) => {
//             callback(item);
//             console.log(item);
//
//         }).catch((error) => {
//             callback(error);
//             console.log("Oops! Something went wrong: " + error);
//
//         });
// }
//
// exports.edit = function (data, callback) {
//     console.log(data);
//
//     var set = Video.update(
//         { owner: data.owner, name_on_file: data.name_on_file },
//         {
//             $set: {
//                 for_deletion: 1
//             }
//         }
//     )
//     callback(set);
// }
//
// module.exports = {
//     model: Video,
//     method: this,
// }


