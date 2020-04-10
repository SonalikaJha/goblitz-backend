const Helper = require('../config/helper');
const User = require('../models/user');
const fs = require('fs');
const storage = require('../config/storage');
const Utils = require('../utils/utils');
const Schedule = require('node-schedule');
const UserStream = require('../models/user_stream');

class UserController {

    static getUserProfile(req, res) {
        User.find({_id: req.user.id}).select('country username name email profileImage bio dob coverImage -_id').lean().then(response => {
            let user = response[0];
            if (!user.profileImage) {
                user.profileImage = storage.defaultUserProfileImage
            }
            if (!user.coverImage) {
                user.coverImage = storage.defaultUserImage
            }
            return Helper.main.response200(res, user, 'user profile');
        }).catch(err => {
            console.log('err', err);
            return Helper.main.response500(res, 'failed', 'user profile');
        })
    }

    static editUserProfile(req, res) {
        let update = req.body;
        //delete update.email;
        delete update.username;
        delete update._id;
        //delete update.name;
        User.findOneAndUpdate({_id: req.user.id}, update, {new: true}).then(user => {
            return Helper.main.response200(res, user, 'user profile updated');
        }).catch(err => {
            console.log('err', err);
            return Helper.main.response500(res, 'failed', 'user profile update failed');
        })
    }

    static editProfileImage(req, res) {
        if (!req.files || !req.files.file) {
            let message = 'image not found in request';
            return Helper.main.response400(res, message, 'profile image update failed');
        }
        let fileObject = Utils.getFileObject(req.files.file, 'profileImageSD');
        fs.writeFile(fileObject.filePath, fileObject.file, function (err) {
            if (err) return console.log(err);
            User.findOneAndUpdate({_id: req.user.id},
                {profileImage: storage.profileImageSD + fileObject.fileName},
                {new: true}).then(user => {
                return Helper.main.response200(res, {}, 'profile image updated');
            }).catch(err => {
                console.log('err', err);
                return Helper.main.response500(res, 'failed', 'profile image update failed');
            })
        });
    }

    static editCoverImage(req, res) {
        if (!req.files || !req.files.file) {
            let message = 'image not found in request';
            return Helper.main.response400(res, message, 'cover image update failed');
        }
        let fileObject = Utils.getFileObject(req.files.file, 'profileCoverImageSD');
        fs.writeFile(fileObject.filePath, fileObject.file, function (err) {
            if (err) return console.log(err);
            User.findOneAndUpdate({_id: req.user.id},
                {coverImage: storage.profileCoverImageSD + fileObject.fileName},
                {new: true}).then(user => {
                return Helper.main.response200(res, {}, 'cover image updated');
            }).catch(err => {
                console.log('err', err);
                return Helper.main.response500(res, 'failed', 'cover image update failed');
            })
        });
    }

    static async updateViewersCount() {
        console.log('[in Schedule of updateViewersCount]');
        let streams = await UserStream.find({
            isLive: false,
            totalPlaybackViews: {$exists: true},
            playbackUrl: {$exists: true}
        });
        let users = await User.find();
        for (const user of users) {
            let count = 0;
            streams.forEach(stream => {
                if (stream.user !== null) {
                    if (JSON.stringify(user._id) === JSON.stringify(stream.user)) {
                        count = count + stream.totalPlaybackViews;
                    }
                }
            });
            if (count > 0) {
                let output = await User.findOneAndUpdate({_id: user._id}, {viewersCount: count},
                    {new: true});
                //console.log(output.viewersCount);
            }
        }
    }
}

Schedule.scheduleJob('0 0 3 * * *', function () {
//Schedule.scheduleJob('0 0/5 * * * *', function () {
    console.log('updateViewersCount scheduler is suppose to run at ', new Date());
    UserController.updateViewersCount();
    console.log('updateViewersCount ended at ', new Date());
});

module.exports = UserController;
