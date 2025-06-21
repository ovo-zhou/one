"use server";
import {
  createPost,
  getPostList,
  deletePost,
  getPostById,
  updatePost,
  changeDeleteStatus
} from "./post";
import { getCommentsByPostId, addComment, deleteComment } from "./comment";
import { getUserInfo } from "./common";
export { getUserInfo };
export { getCommentsByPostId, addComment, deleteComment };
export {
  createPost,
  getPostList,
  deletePost,
  getPostById,
  updatePost,
  changeDeleteStatus,
};
