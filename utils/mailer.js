const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.example.com',
    port: process.env.MAIL_PORT || 587,
    secure: process.env.MAIL_SECURE || false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

// var mailOptions = {
//     from: 'intizar.malik@kritivity.com', // sender address
//     to: 'intizar.malik@kritivity.com', // list of receivers
//     subject: 'Subject of your email', // Subject line
//     html: '<p>Your html here</p>'// plain text body
// };

module.exports = class MailerImp {
    static sendMail(email,token,url,sub, callback){
        console.log(token);
        var mailOptions = {
            from: process.env.MAIL_USER, // sender address
            to: email, // list of receivers
            subject: sub, // Subject line
            html: url // plain text body
        };

        transporter.sendMail(mailOptions,function (err,result) {
            if(err){
                console.log(err);
                callback(err);
            }
            
           // console.log(result);
            transporter.close();
            callback(undefined,result);
           
        });
    }
};
