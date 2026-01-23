import dayjs from 'dayjs';
import { getTimeGreeting } from '@/lib/utils';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BotMessageSquare, Braces } from 'lucide-react';

const [word1, word2] = getTimeGreeting();
export default function Home() {
  const navigate = useNavigate();
  useEffect(() => {
    window.bridge.ping();
  }, []);
  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center gap-10 relative">
      <div className="text-7xl font-bold">origin</div>
      <div className="text-2xl font-thin">
        {word1}，今天是 {dayjs().format('YYYY 年 M 月 D 日')}，{word2}
      </div>
      <div className="flex flex-wrap gap-4">
        <div
          className="flex items-center flex-col gap-2 cursor-pointer"
          onClick={() => {
            navigate('/chat');
          }}
        >
          <BotMessageSquare size={30} />
          <div>AI 助手</div>
        </div>
        <div
          className="flex items-center flex-col gap-2 cursor-pointer"
          onClick={() => {
            navigate('/json-parse');
          }}
        >
          <Braces size={30} />
          <div>JSON 解析</div>
        </div>
      </div>
    </div>
  );
}
