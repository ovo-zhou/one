"use client";
import React, { useEffect, useRef } from "react";
import { useState } from "react";
import MarkdownRender from "@/app/components/markdown/MarkdownRender";
const chatStatusEnum = {
  NORMAL: "normal", // 正常状态
  SEND: "send", // 发送中
  THINK: "think", //思考中
  CONTENT: "content", // 回复中
};
const initContent = "思考中请稍后...";
export default function Ai() {
  const scrollElement = useRef(null);
  const abortController = useRef(null);
  const isComposition = useRef(false);
  const [disableAutoScrollToBottom, setDisableAutoScrollToBottom] =
    useState(false);
  const [chatRecords, setChatRecords] = useState([
    {
      id: 1,
      role: "system",
      content: "你好,我是deepseek",
    },
  ]);
  const [chatStatus, setChatStatus] = useState(chatStatusEnum.NORMAL);
  const [message, setMessage] = useState("");
  useEffect(() => {
    // 如果在流式输出的过程中向上滚动，则禁止自动向下滚动
    if (disableAutoScrollToBottom) {
      return;
    }
    scroll2Bottom();
  }, [chatRecords, disableAutoScrollToBottom]);
  const scroll2Bottom = () => {
    if (!scrollElement || !scrollElement.current) {
      return;
    }
    scrollElement.current.scrollIntoView();
  };
  const sendMessage = async () => {
    // 空消息返回
    if (!message) {
      return;
    }
    const userRecord = { id: +new Date() - 10, role: "user", content: message };
    const systemRecord = {
      id: +new Date() + 10,
      role: "system",
      content: initContent,
    };
    setChatRecords([...chatRecords, userRecord, systemRecord]);
    setMessage("");
    setDisableAutoScrollToBottom(false);
    setChatStatus(chatStatusEnum.SEND);
    const newAbortController = new AbortController();
    abortController.current = newAbortController;
    try {
      const response = await fetch("/admin/ai/api", {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [...chatRecords, userRecord].map((record) => ({
            role: record.role,
            content: record.content,
          })),
          stream: true,
        }),
        signal: newAbortController.signal,
      });
      setChatStatus(chatStatusEnum.CONTENT);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        // console.log(done, value);
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        systemRecord.content = result;
        setChatRecords([...chatRecords, userRecord, systemRecord]);
      }
      setChatStatus(chatStatusEnum.NORMAL);
    } catch (error) {
      // 处理手动暂停
      if (error.name === "AbortError") {
        // 如果content为初始值，意味着还没有收到响应，直接显示暂停回复，其他情况终止请求就行
        if (systemRecord.content === initContent) {
          systemRecord.content = "已暂停回复";
          setChatRecords([...chatRecords, userRecord, systemRecord]);
        }
        // 聊天组状态切回正常
        setChatStatus(chatStatusEnum.NORMAL);
      }
    }
  };
  const handleKeyDown = (e) => {
    // console.log(e);
    if (e.key === "Enter" && !e.shiftKey && !isComposition.current) {
      e.preventDefault();
      sendMessage();
    }
  };
  const handleStop = () => {
    if (abortController && abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
  };
  const handleClearChatRecords = () => {
    setChatRecords([chatRecords.shift()]);
  };
  const handleScroll = (e) => {
    // console.log(e);
    const { offsetHeight, scrollHeight, scrollTop } = e.target;
    // 向上滚动，设置标记，在流式输出的时候，不自动滚动到底,反之允许滚动到底
    if (scrollTop + offsetHeight < scrollHeight - 10) {
      setDisableAutoScrollToBottom(true);
    } else {
      setDisableAutoScrollToBottom(false);
    }
  };
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 6rem)" }}>
      <div
        className="flex-1 overflow-y-auto scroll-smooth"
        style={{ scrollbarWidth: "none" }}
        onScroll={handleScroll}
      >
        {chatRecords.map((record) => {
          return (
            <React.Fragment key={record.id}>
              {record.role === "system" ? (
                <div className="p-4">
                  <MarkdownRender>{record.content}</MarkdownRender>
                </div>
              ) : (
                <div className="p-4 flex justify-end">
                  <div className="bg-slate-100 p-2 rounded-md">
                    {record.content}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
        <div className="h-1" ref={scrollElement}></div>
      </div>
      <div className="relative">
        <textarea
          onCompositionStart={() => {
            isComposition.current = true;
          }}
          onCompositionEnd={() => {
            isComposition.current = false;
          }}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
          className="w-[100%] border-2 rounded-lg p-2 resize-none"
          rows={3}
          placeholder="简单讲两句吧！"
          onKeyDown={handleKeyDown}
        ></textarea>
        <div className="absolute right-0 bottom-0 p-4 flex gap-2 cursor-pointer">
          {chatRecords.length > 1 && chatStatus === chatStatusEnum.NORMAL && (
            <svg
              onClick={handleClearChatRecords}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              className="bi bi-eraser"
              viewBox="0 0 16 16"
            >
              <path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828l6.879-6.879zm2.121.707a1 1 0 0 0-1.414 0L4.16 7.547l5.293 5.293 4.633-4.633a1 1 0 0 0 0-1.414l-3.879-3.879zM8.746 13.547 3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293l.16-.16z" />
            </svg>
          )}
          {chatStatus === chatStatusEnum.NORMAL && message && (
            <svg
              onClick={sendMessage}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              className="bi bi-send"
              viewBox="0 0 16 16"
            >
              <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z" />
            </svg>
          )}
          {chatStatus !== chatStatusEnum.NORMAL && (
            <svg
              onClick={handleStop}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              className="bi bi-stop-circle"
              viewBox="0 0 16 16"
            >
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
              <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h3A1.5 1.5 0 0 1 11 6.5v3A1.5 1.5 0 0 1 9.5 11h-3A1.5 1.5 0 0 1 5 9.5v-3z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
