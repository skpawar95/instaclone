import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(401).json({
                message: "somthing is missing ,please check",
                success: false
            })
        }
        const user = await User.findOne({ email });
        if (user) {
            return res.status(401).json({
                message: "try different email",
                success: false
            });
        };
        const hashedpassword = await bcrypt.hash(password, 10)
        await User.create({
            username,
            email,
            password: hashedpassword
        }); return res.status(201).json({
            message: "Account created successfully",
            success: true
        });

    } catch (error) {
        console.log(error)
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(401).json({
                message: "somthing is missing ,please check",
                success: false
            });
        }
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: "incorrect email or password",
                success: false
            });
        };
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "incorrect email or password",
                success: false
            });
        };


        const token = await jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1d' });
        //populate each post if in the posts array

        const populatedPosts = await Promise.all(
            user.posts.map(async (postId) => {
                const post = await Post.findById(postId);
                if (post.author.equals(user._id)) {
                    return post;
                }
                return null;
            })
        )

        user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: user.posts
        }
        return res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 1 * 24 * 60 * 60 * 1000 }).json({
            message: `Welcome back ${user.username}`,
            success: true,
            user
        })
    } catch (error) {
        console.log(error)
    }
};

export const logout = async (_, res) => {
    try {
        return res.cookie("token", "", { maxAge: 0 }).json({
            message: 'Logged out successfully.',
            success: true
        })
    } catch (error) {
        console.log(error)
    }
};

export const getProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        let user = await User.findById(userId).populate({ path: 'posts', createdAt: -1 }).populate('bookmarks');
        return res.status(200).json({
            user,
            success: true
        });
    } catch (error) {
        console.log(error);
    }
};

export const editProfile = async (req, res) => {
    try {
        const userId = req.id;
        const { bio, gender } = req.body;
        const profilePicture = req.file;
        let cloudResponse;

        if (profilePicture) {
            const fileUri = getDataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri);
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                message: "Usert not found",
                success: false
            })
        };
        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (profilePicture) user.profilePicture = cloudResponse.secure_url;

        await user.save();
        return res.status(200).json({
            message: "User profile Updated",
            success: true,
            user
        })

    } catch (error) {
        console.log(error)

    }
};

export const getSuggestedUsers = async (req, res) => {
    try {
        const SuggestedUsers = await User.find({ _id: { $ne: req.id } }).select("-password");
        if (!SuggestedUsers) {
            return res.status(400).json({
                message: "Currently do not have any users",
                success: false
            })
        };
        return res.status(200).json({
            success: true,
            users: SuggestedUsers
        })
    } catch (error) {
        console.log(error)
    }
}

export const followOrUnfollow = async (req, res) => {
    try {
        const followkrneWla = req.id;
        const jiskoFollowkrunga = req.params.id;

        if (followkrneWla === jiskoFollowkrunga) {
            return res.status(400).json({
                message: "You Cannot follow/unfollow yourself",
                success: false
            })
        }

        const user = await User.findById(followkrneWla);
        const targetUser = await User.findById(jiskoFollowkrunga);

        if (!user || !targetUser) {
            return res.status(400).json({
                message: "User not found",
                success: false
            })
        }

        const isfollowing = user.following.includes(jiskoFollowkrunga);
        if (isfollowing) {
            await Promise.all([
                user.updateOne({ _id: followkrneWla }, { $pull: { following: jiskoFollowkrunga } }),
                user.updateOne({ _id: jiskoFollowkrunga }, { $pull: { followers: followkrneWla } }),
            ])
            return res.status(200).json({ message: "Unfollow succesfully", success: true });
        } else {
            await Promise.all([
                user.updateOne({ _id: followkrneWla }, { $push: { following: jiskoFollowkrunga } }),
                user.updateOne({ _id: jiskoFollowkrunga }, { $push: { followers: followkrneWla } }),
            ])
            return res.status(200).json({ message: "follow succesfully", success: true });
        }

    } catch (error) {
        console.log(error)
    }
};
