import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { CircleStop } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';
interface IProps {
  /**
   * 初始的 agentId
   */
  initAgentId?: string;
  /**
   * 是否流式响应
   */
  isStreamResponse?: boolean;

  /**
   * 手动中断流式输出的回调函数
   */
  stopChat?: () => void;
  /**
   * 提交表单的回调函数
   */
  submit: (value: { message: string; agentId: string }) => undefined;
}

export default function ChatInput(props: IProps) {
  const { submit, initAgentId, isStreamResponse, stopChat } = props;
  const [message, setMessage] = useState<string>('');
  const [agentId, setAgentId] = useState<string>(initAgentId || '');
  const [options, setOptions] = useState<{ id: number; agentName: string }[]>(
    []
  );
  const handleSubmit = () => {
    // 有消息，并且不是流式输出，才提交
    if (message && !isStreamResponse) {
      submit({ message, agentId });
      // 重置一下表单值
      setMessage('');
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // 换行
      if (e.metaKey || e.ctrlKey) {
        const textarea = e.target as HTMLTextAreaElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        // 手动插入换行符
        setMessage(
          (prev) => prev.substring(0, start) + '\n' + prev.substring(end)
        );

        // 恢复光标位置到换行符后
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }, 0);
      } else {
        // 提交表单
        // 如果是在输入中文状态下，不提交，变成选词
        if (e.nativeEvent.isComposing) {
          return;
        }
        // 提交表单
        handleSubmit();
      }
    }
  };
  // 暂停流式输出
  const handleStop = () => {
    stopChat?.();
  };
  useEffect(() => {
    window.agent.getAgentPrompt().then((prompt) => {
      setOptions(prompt);
    });
  }, []);
  // 渲染操作按钮
  const renderButton = () => {
    // 正在流式输出，渲染暂停按钮
    if (isStreamResponse) {
      return (
        <CircleStop
          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleStop}
        />
      );
    }
    // 有消息，渲染发送按钮
    if (message) {
      return (
        <Send
          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleSubmit}
        />
      );
    }
    return null;
  };
  return (
    <div className="flex justify-center">
      <div className="w-3xl py-5">
        <div className="rounded-3xl border-2 border-gray-200 p-3">
          <textarea
            contentEditable
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            placeholder="从 origin 开始"
            className="h-20 resize-none w-full border-none outline-none p-1"
            onKeyDown={handleKeyDown}
            style={{ scrollbarWidth: 'none' }}
          ></textarea>
          <div className="flex justify-between items-center">
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Plus />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-30" align="start">
                  {options.map((item) => {
                    return (
                      <DropdownMenuItem
                        key={item.id}
                        onClick={() => {
                          setAgentId(String(item.id));
                        }}
                      >
                        {item.agentName}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div> {renderButton()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
