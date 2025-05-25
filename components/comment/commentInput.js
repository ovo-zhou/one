"use client";
import React, { useState } from "react";
import { toast } from "sonner";
// size 值  small 小 normal正常
export default function CommentInput(props) {
  const { onOk,size='normal' } = props;

  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!comment) {
      toast.error("还没有输入内容呢");
      return;
    }
    onOk?.(comment);
    setComment("");
  };
  return (
    <div className="relative">
      <textarea
        placeholder="上来说两句吧！"
        rows={size === "small" ? 1 : 3}
        className="resize-none w-full p-2 border rounded-md focus:border-primary  focus:ring-primary focus:outline-none"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      ></textarea>
      <div className="absolute right-0 bottom-0 p-4 cursor-pointer text-black">
        <svg
          onClick={handleSubmit}
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z" />
        </svg>
      </div>
    </div>
  );
}
