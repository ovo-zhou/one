"use client";

import { useEffect, useState } from "react";
import { getCommentsByPostId, addComment, deleteComment } from "@/app/actions";
import message from "../message/messageController";
import CommentInput from "./commentInput";

import CommentItem from "./commentItem";

export default function Comment(props) {
  const { postId } = props;
  const [comments, setComments] = useState([]);

  // 添加评论和回复评论，都走这个接口
  const handleAddComment = async (comment) => {
    const res = await addComment({ comment, postId });
    if (!res) {
      message.success({ content: "请先登录" });
      return;
    }
    console.log("添加评论", res);
    setComments([...comments, ...res]);
  };

  const handleDeleteComment = async (commentId) => {
    const data = await deleteComment(commentId);
    if (data) {
      setComments(comments.filter((item) => item.id !== commentId));
    }
    console.log("删除评论", data);
  };

  useEffect(() => {
    // 查询评论列表
    getCommentsByPostId(postId).then((data) => {
      setComments(data);
    });
  }, [postId]);
  return (
    <div>
      <CommentItem
        comments={comments}
        deleteComment={handleDeleteComment}
      ></CommentItem>
      <CommentInput onOk={handleAddComment}></CommentInput>
    </div>
  );
}
