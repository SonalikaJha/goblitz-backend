const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        name: String,
        username: String,
        email: String,
        password: String,
        dob: Date,
        profileImage: String,
        coverImage: String,
        bio: String,
        isActive: Boolean,
        country: String,
        followersCount: {
            type: Number,
            default: 0
        },
        videoCount: {
            type: Number,
            default: 0
        },
        viewersCount: {
            type: Number,
            default: 0
        },
        isDeactive: {
            type:Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        toObject: {
            transform: (obj, ret) => {
                delete ret.password;
                delete ret.__v;
                ret.id = ret._id;
                delete ret._id;
                return ret;
            }
        }
    }
);

userSchema.pre("save", function (next) {
    this.password = bcrypt.hashSync(this.password, bcrypt.genSaltSync(10));
    next();
});

userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

userSchema.methods.compareHash = function (password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
