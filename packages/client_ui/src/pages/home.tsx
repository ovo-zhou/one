
import dayjs from "dayjs";
import { getTimeGreeting } from "@/lib/utils";
import { useEffect } from "react";
import ChatInput from "@/components/chatInput";
import { useNavigate } from "react-router-dom";

const [word1, word2] = getTimeGreeting();
export default function Home() {
  const navigate= useNavigate()
  useEffect(() => {
    agent.ping();
  }, []);
  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center gap-10">
      <div className="text-7xl font-bold">origin</div>
      <div className="text-2xl font-thin">
        {word1}，今天是 {dayjs().format("YYYY 年 M 月 D 日")}，{word2}
      </div>
      <ChatInput submit={(formValues)=>{
        navigate('/chat',{
          state:formValues
        });
      }}/>
    </div>
  );
}
