"use client";

import { useEffect, useState } from "react";
import { getCommentsByPostId, addComment, deleteComment } from "@/app/actions";
import message from "../message/messageController";
import CommentInput from "./commentInput";

import CommentItem from "./commentItem";

export default function Comment(props) {
  const { postId } = props;
  const [comments, setComments] = useState([]);
  // 游标，用于处理分页
  // 使用游标分页时，除一次查询传入null以外，后面的查询有两种情况
  // 一种是上一次查询最后一条记录的游标
  // 另外一种是 约定值 -1 ，表示没有下一页了
  const [cursor,setCursor]= useState(null) 

  // 添加评论和回复评论，都走这个接口
  const handleAddComment = async (comment) => {
    const res = await addComment({ comment, postId, parentId:0 });
    if (!res) {
      message.success({ content: "请先登录" });
      return;
    }
    // console.log("添加评论", res);
    setComments([res,...comments ]);
  };
 // todo 删除的时候有个bug,把游标的记录删了，会查询不到
  const handleDeleteComment = async (commentId) => {
    const data = await deleteComment(commentId);
    if (data) {
      setComments(comments.filter((item) => item.id !== commentId));
    }
    console.log("删除评论", data);
  };
const handleLoadMoreComments=()=>{
   getCommentsByPostId(postId, cursor).then((res) => {
     const { data, cursor } = res;
     setComments([...comments,...data]);
     setCursor(cursor);
   });
}
  useEffect(() => {
    // 查询评论列表
    getCommentsByPostId(postId, cursor).then((res) => {
      const { data, cursor } = res;
      setComments([...data]);
      setCursor(cursor)
    });
  }, [postId]);
  console.log(comments)
  return (
    <div>
      <CommentItem
        comments={comments}
        deleteComment={handleDeleteComment}
      ></CommentItem>
      {cursor!=-1?<div onClick={handleLoadMoreComments}>加载更多</div>:<div>暂无更多</div>}
      <CommentInput onOk={handleAddComment}></CommentInput>
    </div>
  );
}
