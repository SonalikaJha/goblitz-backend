"use strict";

const User = require("../models/user");
const JWT = require("jsonwebtoken");
const schedule = require('node-schedule');

module.exports = function(server) {
  const io = require("socket.io")(server);
var channels=[];

  io.on("connection", function(socket) {
    console.log("User Connected");
    console.log(socket.id);

    socket.on("storeUserId",(data)=>{
      var channel={
        channelName:'',
        users:[]
      }
      let user={
        'userId': socket.id
      }
      if(channels.length != 0){
        let inCh=false;
        for (let chnl of channels) {
          
          if(chnl.channelName==data.channel){
            inCh=true;
            
            chnl.users.push(user);
          }
          
        }
        if(!inCh){
          channel.channelName=data.channel;
          channel.users.push(user);
          channels.push(channel);
        }
      } else {
       channel.channelName=data.channel;
       channel.users.push(user);
       channels.push(channel);
      }
      


      // console.log(data);
      // let user={
      //   'username':data.username,
      //   'userId': socket.id
      // }
      // if(users.length != 0) {
      //   let isIn=false;
      //    for(let u of users){
      //       if (u.username==user.username) {
      //           u.userId=user.userId;
      //           isIn=true;
      //           console.log("in equal username");
      //       }
      //   }
      //   if(!isIn){
      //     console.log("isIn");
      //     users.push(user);
      //   }
      // } else{
      //   users.push(user);
      //   console.log("else push");
      // }
      
    });


    // recieve chat message from user and emit it again
    socket.on("streamchatmessage", (payload) => {
     // console.log("store users",users);
      console.log("payload",payload);
        JWT.verify(payload.token, process.env.APP_KEY, (err, data) => {
          if (err) {
            return;
          }
          User.findOne({ email: data.email })
            .then(user => {
              if (user) {
                delete payload.token;
                const returningPayload = { time: new Date(), ...payload };
                console.log("returningPayload",returningPayload);
                //console.log(socket.id);
                // let sender='';
                //  users.forEach(u=>{
                //     if(u.username==returningPayload.message.user){
                //         sender=u.userId;
                //   }
                //  });
                for(var channel of channels){
                  if(channel.channelName==payload.to){
                    console.log("in payload .to if");
                    channel.users.forEach(u=>{

                 
                  // if(u.username==payload.to){
                    console.log("to",payload.to);
                    io.to(u.userId).emit("streamchatmessage", returningPayload);
                    // console.log("sender",sender);
                    // io.to(sender).emit("streamchatmessage", returningPayload);
                  
                    });
                  }
                }
                
                //io.emit("streamchatmessage", returningPayload);
              }
            })
            .catch(e => {});
        });
        // socket.broadcast.emit('streamchatmessage', payload);
      });
  });

  schedule.scheduleJob('0 0 5 * * *', function () {
    console.log('Socket job was supposed to run at ' + new Date());
    //console.log("before allChannels",channels);
    channels=[];
    // StreamController.allChannels();
    //console.log("after allChannels",channels);
  });

};

