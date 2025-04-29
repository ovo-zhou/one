import React, { useState } from "react";
import dayjs from "dayjs";
import useUserInfo from "@/app/hooks/useUserInfo";
import Image from "next/image";
import CommentInput from "./commentInput";

export default function CommentItem(props) {
  const { comments, deleteComment } = props;
  const { userInfo } = useUserInfo();
  const [commentId,setCommentId]= useState(null)
  const handleClickReply=(id)=>{
    if(id===commentId){
      setCommentId(null)
      return
    }
     setCommentId(id)
  }
  return (
    <div>
      {comments.map((item) => {
        return (
          <div key={item.id} className="mb-10">
            <div className="flex gap-3">
              <div>
                <Image
                  alt="头像"
                  src={item.author.avatar}
                  width={40}
                  height={40}
                  className="rounded-sm"
                />
              </div>
              <div className="flex-1">
                <div className="h-8 leading-8">{item.author.name}</div>
                <div>{item.content}</div>
                <div className="font-thin text-xs leading-8">
                  <span>
                    {dayjs(Number(item.createdAt)).format(
                      "YYYY-MM-DD HH:mm:ss"
                    )}
                  </span>

                  {item.author.id == userInfo?.id && (
                    <>
                      <span
                        className="pl-6 cursor-pointer"
                        onClick={() => {
                          handleClickReply(item.id);
                        }}
                      >
                        回复
                      </span>
                      <span
                        className="pl-6 cursor-pointer"
                        onClick={() => deleteComment(item.id)}
                      >
                        删除
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {commentId === item.id && <CommentInput size={'small'}/>}
          </div>
        );
      })}
    </div>
  );
}
