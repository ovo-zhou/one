import dayjs from 'dayjs';
import { getTimeGreeting } from '@/lib/utils';
import { useEffect } from 'react';
import ChatInput from '@/components/chatInput';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';

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
      <ChatInput
        submit={(formValues) => {
          navigate('/chat', {
            state: formValues,
          });
        }}
      />
      <div
        className="absolute right-10 bottom-10 cursor-pointer hover:rotate-180 hover:scale-105 transition-transform duration-300"
        onClick={() => {
          navigate('/setting');
        }}
      >
        <Settings />
      </div>
    </div>
  );
}
