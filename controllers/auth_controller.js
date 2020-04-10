const LoginValidator = require("../validators/app/login_validator");
const RegisterValidator = require("../validators/register_validator");

const User = require("../models/user");
const ApiToken = require("../models/apitoken");
const LoginLog = require("../models/login_log");

const AuthUserResource = require("../resources/app/auth_user_resource");

const JWT = require("jsonwebtoken");

const Bcrypt = require("bcrypt");

const Mailer = require("../utils/mailer");
const ForgetPassword = require("../models/ActivationForgetPassword");
const ValidatePassword = require("../validators/validatePassword");
const ActivateAccount = require("../models/activateAcount");

class AuthController {
    static register(req, res) {
        console.log("req::",req);
        const validator = new RegisterValidator(req);

        if (validator.fails()) {
            return res.status(422).json({
                message: "Some validation error occurred!",
                errors: validator.errors().all()
            });
        }
        const validated = validator.validated;
        validated.isActive=false;
        User.findOne({
            $or: [{email: validated.email}, {username: validated.username}]
        })
            .then(user => {
                if (user) {
                    // user exists
                    if (user.email === validated.email) {
                        return res.status(422).json({
                            message: "Email already in use!",
                            errors: {email: ["Email already in use!"]}
                        });
                    }
                    if (user.username === validated.username) {
                        return res.status(422).json({
                            message: "Username already taken!",
                            errors: {username: ["Username already taken!"]}
                        });
                    }
                } else {
                    User.create(validated)
                        .then(user => {
                                // TODO: Send user verification email
                                JWT.sign(user.toObject(), process.env.APP_KEY, {expiresIn: "2 days"}, function (err, token) {
                                    if (err) {
                                        throw err;
                                    }
                                    ActivateAccount.create({email: user.email, token: token})
                                        .then(apiToken => {
                                            // TODO: Send login alert
                                            // TODO: Track user ip
        
                                          //  LoginLog.create({user: user.id, ipAddress: ipAddress, status: 1});
                                          let sub="GoBlitz - Activate Your Account"
                                         // let url="Hi,"+user.username+"<br><br>"+"To activate your account <a href='http://"+process.env.SITE_URL+"/activate-account?token="+token+"'>click here</a>"+"<br><br><br>"+"from GoBlitz <br>goblitz.tv";
                                         
                                          let url="Hello "+user.username+","
                                          +"<br><br>Welcome to GoBlitz!"
                                          +"<br><br>To activate your account please click the link below and verify your email address:"
                                          +"<br>"+"<a href='http://"+process.env.SITE_URL+"/activate-account?token="+token+"'>click here</a>"
                                          +"<br><br>Or paste this link into your browser:"
                                          +"<br>http://"+process.env.SITE_URL+"/activate-account?token="+token
                                          +"<br><br>Questions? Please visit our Support Center"
                                          +"<br><br>Happy Streaming!"
                                          +"<br>GoBlitz Team";
                                          Mailer.sendMail(user.email,token,url,sub,(err,result)=>{
                                            if(err){
                                                console.log(err);
                                                throw err;
                                                // return res.status(422).json({
                                                //     message: "Some validation error occurred!",
                                                //     errors: ""
                                                // });
                                            }
                                            console.log(result);
                                            return res.json({
                                                message: "send link on your mail!",
                                                data: Object.assign(apiToken.toObject(), user.toObject())
                                            });
                                          });
                                          //console.log(mail);
                                         
                                           
                                        
                                        });  
                                    });        
                                       


                            return res.json({
                                message: "Please activate your account using the link sent on email.",
                                data: new AuthUserResource(user)
                            });
                        })
                        .catch(e => {
                            throw e;
                        });
                }
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({message: "Some error occured!"});
            });
    }

    static login(req, res) {
        const validator = new LoginValidator(req);
        let ipAddress = req.connection.remoteAddress;
        if (validator.fails()) {
            return res.status(422).json({
                message: "Some validation error occurred!",
                errors: validator.errors().all()
            });
        }

        const validated = validator.validated;

        User.findOne({
            $or: [{email: validated.email}, {username: validated.username}]
        })
            .then(user => {

                if (!user) {
                    return res.status(422).json({
                        message: "User not found!",
                        errors: {username: ["User not found!"]}
                    });
                } else {
                    let msg='';
                    if(user.isDeactive){
                        msg="Account re-activated successfully.";
                        User.findOneAndUpdate({_id:user._id},{isDeactive:false}).then(result=>{
                            console.log(result);
                        }).catch(err=>{
                            console.log(err);
                            throw err;
                        });
                    }
                    if(!user.isActive && !undefined){
                        return res.status(422).json({
                            message: "Please activate your account using the link sent on email.",
                            errors: {activate: ["Please activate your account using the link sent on email."]}
                        });
                    }
                    if (!user.compareHash(validated.password)) {

                        LoginLog.create({user: user.id, ipAddress: ipAddress, status: 0});

                        return res.status(422).json({
                            message: "Password incorrect!",
                            errors: {password: ["Password incorrect!"]}
                        });
                    }
                    JWT.sign(user.toObject(), process.env.APP_KEY, {expiresIn: "365 days"}, function (err, token) {
                            if (err) {
                                throw err;
                            }
                            ApiToken.create({email: user.email, token: token})
                                .then(apiToken => {
                                    // TODO: Send login alert
                                    // TODO: Track user ip

                                    LoginLog.create({user: user.id, ipAddress: ipAddress, status: 1});
                                    if(msg==''){
                                        return res.json({
                                        message: "Login successfully!",
                                        data: Object.assign(apiToken.toObject(), user.toObject())
                                        });
                                    } else {
                                        return res.json({
                                        message: msg,
                                        data: Object.assign(apiToken.toObject(), user.toObject())
                                        });
                                    }
                                    
                                })
                                .catch(err => {
                                    throw err;
                                });
                        }
                    );
                }
            })
            .catch(e => {
                console.log(e);
                res.status(500).json({message: "Some error occured!"});
            });
    }

    static profile(req, res, next) {
        return res.json(req.user);
    }

    static forgetPassword(req,res){
        console.log(req.body.email);
        let email=req.body.email;
        console.log(email);
        User.findOne({
            email: email
        })
            .then(user => {

                if (!user) {
                    console.log("user not found");
                    return res.status(422).json({
                        message: "User not found!",
                        errors: {email: ["User not found!"]}
                    });
                } else {
                    
                    JWT.sign(user.toObject(), process.env.APP_KEY, {expiresIn: "2 days"}, function (err, token) {
                            if (err) {
                                throw err;
                            }
                            ForgetPassword.create({email: user.email, token: token})
                                .then(apiToken => {
                                    // TODO: Send login alert
                                    // TODO: Track user ip

                                  //  LoginLog.create({user: user.id, ipAddress: ipAddress, status: 1});
                                  let sub="GoBlitz - Reset Your Password";
                                  let url="Hello "+user.username+","
                                  +"<br><br>Welcome to GoBlitz!"
                                  +"<br><br>To reset your password please click the link below and verify your email address:"
                                  +"<br>"+"<a href='http://"+process.env.SITE_URL+"/forget-password?token="+token+"'>click here</a>"
                                  +"<br><br>Or paste this link into your browser:"
                                  +"<br>http://"+process.env.SITE_URL+"/forget-password?token="+token
                                  +"<br><br>Questions? Please visit our Support Center"
                                  +"<br><br>Happy Streaming!"
                                  +"<br>GoBlitz Team";
                                  Mailer.sendMail(email,token,url,sub,(err,result)=>{
                                    if(err){
                                        throw err;
                                        console.log(err);
                                    }
                                    console.log(result);
                                    return res.json({
                                        message: "send link on your mail!",
                                        data: Object.assign(apiToken.toObject(), user.toObject())
                                    });
                                  });
                                  //console.log(mail);
                                 
                                   
                                
                                    
                                })
                                .catch(err => {
                                   console.log(err);
                                });
                        }
                    );
                }
            })
            .catch(e => {
                console.log(e);
                res.status(500).json({message: "Some error occured!"});
            });

        
    }

    static updatePassword(req,res){
        
       let token = req.body.token;
       console.log(req.body);

       let validator=new ValidatePassword(req);

       if (validator.fails()) {
        return res.status(422).json({
            message: "Some validation error occurred!",
            errors: validator.errors().all()
        });
    }
       let validated = validator.validated;
       let password =  Bcrypt.hashSync(validated.password, Bcrypt.genSaltSync(10));
       console.log(password);
        ForgetPassword.findOne({token: token}).
        then(user=>{

            if(user==null){
                 return res.status(422).json({
                    message: "Token had been expired!",
                    errors: {token: ["token not found!"]}
                    });
            }

            console.log('user',user);
            if(user.token===token){
                User.findOneAndUpdate({email:user.email},{password:password}).then(result=>{
                    delete result.password;
                    console.log("before delete");
                    ForgetPassword.findOneAndRemove({token: user.token }).then(deleted=>{
                        console.log(deleted);
                    }).catch(err=>{
                        console.log(err);
                    });
                    console.log("after delete");
                    return res.json({
                        message: "Password update successfully!",
                        data: result});
                    
                }).catch( err=>{
                   throw err;
                });
            }
        }).
        catch(err => {
            console.log(err);
                res.status(500).json({message: "Some error occured!"});
        })
    }

    static activateAccount(req,res){
        let token = req.body.token;
        console.log(req.body);
 
       // let validator=new ValidatePassword(req);
 
    //     if (validator.fails()) {
    //      return res.status(422).json({
    //          message: "Some validation error occurred!",
    //          errors: validator.errors().all()
    //      });
    //  }
    //     let validated = validator.validated;
    //     let password =  Bcrypt.hashSync(validated.password, Bcrypt.genSaltSync(10));
    //     console.log(password);
        ActivateAccount.findOne({token: token}).
         then(user=>{
            if(user==null){
                 return res.status(422).json({
                    message: "Token had been expired!",
                    errors: {token: ["token not found!"]}
                    });
            }
             if(user.token===token){
                 User.findOneAndUpdate({email:user.email},{isActive:true}).then(result=>{
                    delete result.password; 
                    ActivateAccount.findOneAndRemove({token: user.token }).then(deleted=>{
                        console.log(deleted);
                    }).catch(err=>{
                        console.log(err);
                    });
                    return res.json({
                         message: "Account activated successfully!",
                         data: result});
                     
                 }).catch( err=>{
                    throw err;
                 });
             }
         }).
         catch(err => {
             console.log(err);
                 res.status(500).json({message: "Some error occured!"});
         })
     }

     static deactivateAccount(req,res){
       // let password =  Bcrypt.hashSync(req.body.password, Bcrypt.genSaltSync(10));
        console.log(req.body);
        let user = req.user;
        console.log("user",user);

        User.findOne({_id:user.id}).then(result=>{
            console.log(result);
            if(!result.compareHash(req.body.password)){
                return res.status(422).json({
                    message: "Password is incurrect!",
                    errors: {password: ["Password is incurrect!"]}
                    });
            }

            User.findOneAndUpdate({_id:result._id},{isDeactive:true}).then(deactived=>{
                console.log(deactived);
                return res.json({
                         message: "Your account deactivated successfully!",
                         data: result});
            }).catch(err=>{
                throw err;
            });
            
        }).catch(err=>{
           console.log(err);
                 res.status(500).json({message: "Some error occured!"});
        });

     }

}

module.exports = AuthController;
