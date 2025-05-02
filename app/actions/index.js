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
import { decodeCookie } from "./common";
export { decodeCookie };
export { getCommentsByPostId, addComment, deleteComment };
export {
  createPost,
  getPostList,
  deletePost,
  getPostById,
  updatePost,
  changeDeleteStatus,
};
