import React from "react";
import dayjs from "dayjs";
import useUserInfo from "@/app/hooks/useUserInfo";
import { deleteComment } from "@/app/actions";

export default function CommentItem(props) {
  const { comments, deleteComment } = props;
  const { userInfo } = useUserInfo();
  return (
    <div>
      {comments.map((item) => {
        return (
          <div key={item.id} className="flex gap-3 mb-4">
            <div>
              <img src={item.image} className="w-10 h-10 rounded-sm" />
            </div>
            <div className="flex-1">
              <div className="h-8 leading-8">{item.username}</div>
              <div>{item.content}</div>
              <div className="font-thin text-xs leading-8">
                <span>
                  {dayjs(Number(item.published)).format("YYYY-MM-DD HH:mm:ss")}
                </span>
                <span className="pl-6 cursor-pointer">回复</span>
                {item.userId == userInfo.uid && (
                  <span
                    className="pl-6 cursor-pointer"
                    onClick={() => deleteComment(item.id)}
                  >
                    删除
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
