"use client";
import { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom/client";
import Message from ".";
function MessageController(props) {
  const { registerPushMessageEvent } = props
  const [messages, setMessages] = useState([]);

  const pushMessage = useCallback((message) => {
    setMessages((pre) => {
      return [...pre, message]
    })
  }, [setMessages])

  useEffect(() => {
    registerPushMessageEvent(pushMessage)
  }, [registerPushMessageEvent, pushMessage])

  if (messages.length === 0) {
    return null
  }

  return (
    <div className="fixed top-3 left-1/2 transform -translate-x-1/2 p-2">
      {messages.map((message) => {
        return <Message {...message} key={message.id}></Message>;
      })}
    </div>
  );
}
function createMessage() {
  let mountNode = null
  let pushMessage = null
  let registerPushMessageEvent = (pushMessageInside) => {
    pushMessage = pushMessageInside
  }
  return function () {
    if (typeof window === "undefined") {
      return
    }
    if (!mountNode) {
      mountNode = document.createElement("div");
      document.body.appendChild(mountNode);
    }
    const root = ReactDOM.createRoot(mountNode);
    // 渲染根组件
    root.render(
      <MessageController registerPushMessageEvent={registerPushMessageEvent}></MessageController>
    );
    return {
      success: ({ content, duration, showIcon }) => {
        pushMessage({
          id: Date.now(),
          content,
          duration,
          showIcon,
          type: "success"
        })
      },
      error: ({ content, duration, showIcon }) => {
        pushMessage({
          id: Date.now(),
          content,
          duration,
          showIcon,
          type: "error"
        })
      },
      warning: ({ content, duration, showIcon }) => {
        pushMessage({
          id: Date.now(),
          content,
          duration,
          showIcon,
          type: "warning"
        })
      },
      info: ({ content, duration, showIcon }) => {
        pushMessage({
          id: Date.now(),
          content,
          duration,
          showIcon,
          type: "info"
        })
      },
    }
  }
}
const message = createMessage()
export default message()