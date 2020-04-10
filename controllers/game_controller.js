const Game = require('../models/game');
const Helper = require('../config/helper');
const Utils = require('../utils/utils');
const storage = require('../config/storage');
const _ = require('underscore');
const GameUserFollower = require('../models/game_user_follower');

class GameController {
    static async getAll(req, res) {
        try {
            let response = await Game.find({status: true}).sort({viewersCount: -1}).populate('tags').lean();
            let games = _.map(response, game => {
                let tags = [];
                if (game.tags && game.tags.length > 0) {
                    tags = _.map(game.tags, (tag) => {
                        return tag.tag;
                    });
                    game.tags = tags;
                }
                return game
            });
            return Helper.main.response200(res, games, 'games list')
        } catch (e) {
            console.log(e);
            return Helper.main.response500()
        }
    }

    static async create(req, res) {
        let gameObject = req.body;
        //gameObject.status = gameObject.status === "true";
        if (req.files.image) {
            try {
                let fileObject = Utils.getFileObject(req.files.image, 'gamesImage');
                await Utils.writeFile(fileObject.filePath, fileObject.file);
                gameObject.image = storage.gamesImage + fileObject.fileName
            } catch (e) {
                console.log(e);
                return Helper.main.response500(res);
            }
        }
        if (req.files.coverImage) {
            try {
                let fileObject = Utils.getFileObject(req.files.coverImage, 'gamesImage');
                await Utils.writeFile(fileObject.filePath, fileObject.file);
                gameObject.coverImage = storage.gamesImage + fileObject.fileName
            } catch (e) {
                console.log(e);
                return Helper.main.response500(res);
            }
        }
        console.log("gameObject", gameObject);
       let tags= gameObject.tags.split(",");
       gameObject.tags=tags;
        let response = await Game.create(gameObject);
        console.log(response);
        return Helper.main.response200(res, response);
    }

    static async getById(req,res){
        let title = req.body.title;
        const response = await Game.findOne({title: title}).populate('tags');
        Helper.main.response200(res, response);
    }

    static async updateFollowers(req,res){
        let id = req.body._id;
        let user = req.user;
        try {
            let follow = await GameUserFollower.findOne({game: id, user: user.id});
            console.log("follow user", follow);
            if (follow === null) {

                let option = {
                    game: id,
                    user: user.id,
                    isFollowed: true,
                    status: true,
                    ipAddress: req.connection.remoteAddress
                };
                let responseFollower = await GameUserFollower.create(option);

                let response = await Game.findOne({_id: id}).populate('tags');
                response.followersCount = response.followersCount + 1;
                let responseData = await Game.updateOne({_id: id}, {$set: {followersCount: response.followersCount}});

                Helper.main.response200(res, responseFollower);
            } else {
                if(follow.status === false){
                    let responseFollower = await GameUserFollower.updateOne({_id: follow._id}, {$set: {status: true}});

                    let response = await Game.findOne({_id: id}).populate('tags');
                    response.followersCount = response.followersCount + 1;
                    let responseData = await Game.updateOne({_id: id}, {$set: {followersCount: response.followersCount}});
                    Helper.main.response200(res, responseFollower);
                } else{
                    Helper.main.response500(res, 'failed', 'Already followed');
                }
                
            }
        }catch (e) {
            Helper.main.response500(res, 'failed');
        }
    }

    static  async unfollow(req,res) {
        let id = req.body._id;
        let user = req.user;
        try {
            let follow = await GameUserFollower.findOne({game: id, user: user.id});if(follow !==null){
                let responseFollower = await GameUserFollower.updateOne({user: user.id, game: id}, {$set: {status: false}});

                let response = await Game.findOne({_id: id}).populate('tags');
                response.followersCount = response.followersCount - 1;
                let responseData = await Game.updateOne({_id: id}, {$set: {followersCount: response.followersCount}});
                Helper.main.response200(res, responseFollower);

                //Helper.main.response200(res, responseFollower);
            }

        } catch (e) {
            console.log(e);
            Helper.main.response500(res, 'failed');
        }

    }
    static  async followStatus(req,res){
        let id = req.body._id;
        let user = req.user;
        try {
            let follow = await GameUserFollower.findOne({game: id, user: user.id});
            if(follow ===null){
                Helper.main.response200(res, 'false');
            } else {
                if(follow.status){
                    Helper.main.response200(res, 'true');
                }else {
                    Helper.main.response200(res, 'false');
                }
            }
        } catch (e) {
            Helper.main.response500(res, 'failed');
        }
    }
    static async addFollowersCount(req,res){

        let response = await Game.find();
        response.forEach( async r=>{
            console.log("add on data");
            await Game.findOneAndUpdate({_id:r._id},{followersCount:0});
        });
    }
}

module.exports = GameController;
