import React, { useState } from "react";
import dayjs from "dayjs";
import useUserInfo from "@/app/hooks/useUserInfo";
import Image from "next/image";

export default function CommentItem(props) {
  const { onDelete, comment, onReply } = props;
  const { userInfo } = useUserInfo();

  return (
    <div key={comment.id} className="">
      <div className="flex gap-3">
        <div>
          <Image
            alt="头像"
            src={comment.author.avatar}
            width={40}
            height={40}
            className="rounded-sm"
          />
        </div>
        <div className="flex-1">
          <div className="h-8 leading-8">{comment.author.name}</div>
          <div>{comment.content}</div>
          <div className="font-thin text-xs leading-8">
            <span>
              {dayjs(Number(comment.createdAt)).format("YYYY-MM-DD HH:mm:ss")}
            </span>
            {comment.author.id == userInfo?.id && (
              <>
                <span className="pl-6 cursor-pointer" onClick={onReply}>
                  回复
                </span>
                <span
                  className="pl-6 cursor-pointer"
                  onClick={() => onDelete(comment.id)}
                >
                  删除
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
