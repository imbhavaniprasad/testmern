//add apis here
const express = require("express");
const { createPost, likeAndUnlikePost, deletePost, getPostOfFollowing, updateCaption, addComment, deleteComment } = require("../controllers/Post");
const { isAuthenticated } = require("../middlewares/auth");

const router = express.Router();
router.route("/post/upload").post(isAuthenticated, createPost);
router.route("/posts").get(isAuthenticated, getPostOfFollowing);
router.route("/post/:id").get(isAuthenticated, likeAndUnlikePost)
    .put(isAuthenticated, updateCaption)
    .delete(isAuthenticated, deletePost);
router.route("/post/comment/:id").put(isAuthenticated, addComment)
    .delete(isAuthenticated, deleteComment);
module.exports = router;