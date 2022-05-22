const User = require("../models/User");
const Post = require("../models/Post");
const crypto = require("crypto");
const { sendEmail } = require("../middlewares/sendEmail");
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }
        user = await User.create({
            name,
            email,
            password,
            avatar: { public_id: "test id", url: "test url" },
        }
        );
        res.status(200).json({ success: true, user });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select("+password").populate("posts followers following");
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User doesnt exists"
            });
        }
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect Password"
            });
        }
        const token = await user.generateToken();
        const options = {
            expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            httpOnly: true
        };
        res.status(201).cookie("token", token, options).json({
            success: true, user, token
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
};
exports.logout = async (req, res) => {
    try {
        res.status(200).cookie("token", null,
            { expires: new Date(Date.now()), httpOnly: true }).json({
                success: true,
                message: "logged out"
            })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
};
exports.updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("+password");
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Please provide old and new password"
            });
        }
        const isMatch = await user.matchPassword(oldPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect Old Password"
            });
        }
        user.password = newPassword;
        await user.save();
        res.status(200).json({
            success: true,
            message: "Password Changed"
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
};
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { name, email } = req.body;
        if (name) {
            user.name = name;
        }
        if (email) {
            user.email = email;
        }
        await user.save();
        res.status(200).json({
            success: true,
            message: "profile updated"
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
exports.deleteProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User doesnt exist"
            });
        }
        const posts = user.posts;
        //delete followers
        const followers = user.followers;
        const following = user.following;
        await user.remove();
        //Logout user after delete profile
        res.cookie("token", null,
            { expires: new Date(Date.now()), httpOnly: true });
        //delete all user's posts;
        for (let i = 0; i < posts.length; i++) {
            const post = await Post.findById(posts[i]);
            await post.remove();
        }
        //delete this profile from followers following
        for (let i = 0; i < followers.length; i++) {
            const follower = await User.findById(followers[i]);
            const index = follower.following.indexOf(user._id);
            follower.following.splice(index, 1);
            await follower.save();
        }
        //delete from following followers
        for (let i = 0; i < following.length; i++) {
            const follows = await User.findById(following[i]);
            const index = follows.followers.indexOf(user._id);
            follows.followers.splice(index, 1);
            await follows.save();
        }
        res.status(200).json({
            success: true,
            message: "profile deleted"
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
exports.followUser = async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const loggedInUser = await User.findById(req.user._id);
        if (!userToFollow) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }
        if (loggedInUser.following.includes(userToFollow._id)) {
            const index = loggedInUser.following.indexOf(userToFollow._id);
            loggedInUser.following.splice(index, 1);
            const indexFollowers = userToFollow.followers.indexOf(loggedInUser._id);
            userToFollow.followers.splice(indexFollowers, 1);
            await loggedInUser.save();
            await userToFollow.save();
            res.status(200).json({
                success: true,
                message: "Unfollowed User"
            });
        }
        else {
            loggedInUser.following.push(userToFollow._id);
            userToFollow.followers.push(loggedInUser._id);
            await loggedInUser.save();
            await userToFollow.save();
            res.status(200).json({
                success: true,
                message: "Following User"
            });
        }

    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
};
exports.myProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("posts followers following");

        res.status(200).json({
            success: true,
            user
        });

    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
};
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate("posts");
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User doesnt exist"
            });
        }
        res.status(200).json({
            success: true,
            user
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json({
            success: true,
            users
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
};
exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        const resetPasswordToken = user.getResetPasswordToken();

        await user.save();
        const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetPasswordToken}`;
        const message = `Reset Password by clicking this url: \n\n ${resetUrl}`;
        try {
            await sendEmail({
                email: user.email,
                subject: "Reset Password",
                message,
            });
            res.status(200).json({
                success: true,
                message: "Email send"
            })
        }
        catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
};
exports.resetPassword = async (req, res) => {
    try {
        const resetPasswordToken = crypto.createHash("sha256").
            update(req.params.token).digest("hex");
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: {
                $gt: Date.now(),
            }
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: "link expired"
            });
        }
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        res.status(200).json({
            success: true,
            message: "password updated"
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
exports.getMyPosts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const posts = [];
        for (let i = 0; i < user.posts.length; i++) {
            const post = await Post.findById(user.posts[i]).
                populate("likes owner comments.user");
            posts.push(post);
        }
        res.status(200).json({
            success: true,
            posts
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
};