const fs = require('fs');
const uuidv4 = require('uuid/v4');
const storage = require('../config/storage');
const UserStreams = require('../models/user_stream');
const Users = require('../models/user');
const _ = require('underscore');

let imageExtensions = ['png', 'jpeg', 'jpg'];

module.exports = class Utils {

    static getFileObject(file, type) {
        let arr = file.name.split('.');
        let fileExtension = arr[arr.length - 1];
        if (!imageExtensions.includes(fileExtension)) {
           throw 'invalid file'
        }
        let fileName = uuidv4() + '.' + fileExtension;
        let filePath = storage.base + storage[type] + fileName;
        return {
            file: file.data,
            fileExtension,
            fileName,
            filePath
        }
    }

    static async writeFile(path, file) {
        try {
            fs.writeFileSync(path, file);
            return 'ok'
        } catch (e) {
            throw e
        }
    }

    static async getLatestStream(user) {
        let response = await UserStreams.find({user: user[0]._id})
            .select('-gameDescription -updatedAt -createdAt -startTime')
            .sort({updatedAt: -1})
            .lean()
            .populate('user', 'username profileImage -_id')
            .populate('tags', 'tag -_id')
            .populate('game', 'title -_id');
        if (response.length > 0) {
            let tags = [];
            response[0].tags.forEach((tag) => {
                tags.push(tag.tag);
            });
            response[0].tags = tags;
        }
        return response[0];
    }

    static async filterActiveUsersById(users) {
        return _.forEach(users, async user => {
            let res = await Users.find({_id: user, isActive: true});
            return res;
        });

    }

    static isJson(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
};
