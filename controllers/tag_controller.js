const Helper = require('../config/helper');
const Tag = require('../models/tag');
const NodeMediaServer = require('../services/NodeMediaServer');

class TagController {
    static async getAll(req, res) {
        try {
            let response = await Tag.find();
            //console.log('response', response);
            return Helper.main.response200(res, response, 'Tags list')
        } catch (e) {
            console.log(e);
            return Helper.main.response500()
        }
    }
    

    static async getTagIdByName(tagsArray) {
        let tags = await Tag.find({tag: {$in: tagsArray}});
        let tagIds = [];
        tags.forEach(tag => {
            tagIds.push(tag._id)
        });
        return tagIds
    }

    static async create(req, res) {
        if (!req.body || !req.body.tags || !Array.isArray(req.body.tags)) {
            return Helper.main.response400(res, {}, 'Passed parameter is not correct');
        } else if (req.body.tags.length === 0) {
            return Helper.main.response400(res, {}, 'Tags should not be empty');
        }
        let tags = req.body.tags;
        let result = [];
        let dbTags = await Tag.find();

        await Promise.all(
            tags.map(async tag => {
                let isInDb=false;
                dbTags.forEach(t=>{
                    if(t.tag==tag){
                        if(t.status){
                            isInDb=true;
                        }
                        else{
                            isInDb=true;
                            console.log('t._id', t._id);
                            Tag.findOneAndUpdate({tag:tag},{status:true}).then(data=>{
                                console.log(data);
                            }).catch(e=>{
                                console.log(e)
                            });

                        }
                    }
                });
                if(!isInDb){
                    console.log('tags', tags);
                    let response = await Tag.create({tag});
                    result.push(response);
                }
            
            })
        );
        return Helper.main.response200(res, result, `${tags.length} Tags updated`);
    }


    static async setActive(req,res){
        let tags= req.body.tags;
        let dbTag=[];
        try{
          for (const tag of tags) {
            let t=await Tag.findOneAndUpdate({tag:tag},{status:true});
            dbTag.push(t);
          }
          
        
        return Helper.main.response200(res, dbTag, "Tag activated successfully");
        } catch(e){
            console.log(e);
            return Helper.main.response500(res, "something wrong!");
        }
    }

    static async setInActive(req,res){
        let tag = req.body.tag;
        try{
        let dbTag=await Tag.findOneAndUpdate({tag:tag},{status:false});
        return Helper.main.response200(res, dbTag, "Tag deactivated successfully");
        } catch(e){
            console.log(e);
            return Helper.main.response500(res, "something wrong!");
        }
    }
    static async setSingleActive(req,res){
        let tag = req.body.tag;
        try{
        let dbTag=await Tag.findOneAndUpdate({tag:tag},{status:true});
        return Helper.main.response200(res, dbTag, "Tag activated successfully");
        } catch(e){
            console.log(e);
            return Helper.main.response500(res, "something wrong!");
        }
    }
    static async getAllInactiveTag(req, res) {
        try 
            {
            let response = await Tag.find({status:false});
            console.log('response', response);
            return Helper.main.response200(res, response, 'Inactive Tags list')
            
        } catch (e) {
            console.log(e);
            return Helper.main.response500()
        }
    }
    static async getAllactiveTag(req, res) {
        try 
            {
            let response = await Tag.find({status:true});
            console.log('response', response);
            return Helper.main.response200(res, response, 'Active Tags list')
            
        } catch (e) {
            console.log(e);
            return Helper.main.response500(res);
        }
    }

    static async watchingNow(req, res) {
        let userId = req.params.userId;
        let totalLiveViews = NodeMediaServer.watchingNow;
        if (!totalLiveViews.hasOwnProperty(userId)) {
            return Helper.main.response200(res, 0,'something wrong with data');
        } else {
            let count = totalLiveViews[userId].length - 1;
            console.log('[count]',count);
            return Helper.main.response200(res, count,'ok');
        }
    }
}

module.exports = TagController;
