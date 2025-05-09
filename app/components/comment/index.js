"use client";

import React, { useContext, useEffect, useReducer, useState } from "react";
import { getCommentsByPostId, addComment, deleteComment } from "@/app/actions";
import CommentInput from "./commentInput";
import CommentItem from "./commentItem";


function Comment(props) {
  // parentId=0 是评论，其他值是回复
  const { postId, parentId = 0 } = props;
  const [comments, setComments] = useState([]);
  const [cursor, setCursor] = useState(null);
  const { currentInput, dispatch } = useContext(CommentContext);
  // console.log("currentInput", currentInput);

  // 评论和回复都走这个接口，只需要传递不同的 parentId 值即可
  const handleAddComment = async (comment, parentId, replyToAuthorId) => {
    const res = await addComment({
      comment,
      postId,
      parentId,
      replyToAuthorId,
    });
    setComments([res, ...comments]);
  };
  const handleDeleteComment = async (commentId) => {
    const data = await deleteComment(commentId);
    if (data) {
      setComments(comments.filter((item) => item.id !== commentId));
    }
  };
  const handleLoadMoreComments = () => {
    getCommentsByPostId(postId, parentId,cursor).then((res) => {
      const { data, cursor } = res;
      setComments([...comments, ...data]);
      setCursor(cursor);
    });
  };
  useEffect(() => {
    getCommentsByPostId(postId, parentId, cursor).then((res) => {
      const { data, cursor } = res;
      // console.log("data", data);
      setComments([...data]);
      setCursor(cursor);
    });
  }, [postId, parentId]);
  // console.log('comments', comments);
  return (
    <div>
      {(parentId === 0||currentInput === parentId)&& <CommentInput
          size={parentId === 0 ? "normal" : "small"}
          onOk={(message) => {
            handleAddComment(message, parentId);
          }}
        ></CommentInput>}

      {comments.map((comment) => {
        return (
          <React.Fragment key={comment.id}>
            <CommentItem
              comment={comment}
              onReply={() => {
                dispatch({ payload: comment.id });
              }}
              onDelete={handleDeleteComment}
            ></CommentItem>
            {parentId != 0 && currentInput === comment.id && (
              <CommentInput
                onOk={(message) => {
                  handleAddComment(message, parentId, comment.authorId);
                }}
                size="small"
              ></CommentInput>
            )}

            {comment.parentId === 0 && (
              <div className="ml-4 p-4">
                <Comment
                  postId={postId}
                  parentId={comment.id}
                  replyToAuthorId={comment.authorId}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
      {cursor != -1 ? (
        <div onClick={handleLoadMoreComments}>加载更多</div>
      ) : (
        <div>暂无更多</div>
      )}
    </div>
  );
}
const reducer = (state, action) => {
  // console.log("reducer", state, action);
  return action.payload;
};
const CommentContext= React.createContext()

export default function CommentProvider(props) {
  const { postId } = props;
  const [currentInput, dispatch] = useReducer(reducer, null);
  return (
    <CommentContext.Provider value={{ currentInput, dispatch }}>
      <Comment postId={postId} />
    </CommentContext.Provider>
  );
}