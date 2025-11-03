import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
interface IProps {
  initAgentId?: string;
  submit: (value: { message: string; agentId: string }) => undefined;
}

export default function ChatInput(props: IProps) {
  const { submit, initAgentId } = props;
  const [message, setMessage] = useState<string>("");
  const [agentId, setAgentId] = useState<string>(initAgentId||"");
  const [options,setOptions]= useState<{id:number,agentName:string}[]>([])
  const handleSubmit = () => {
    if (message) {
      submit({ message, agentId });
      // 重置一下表单值
      setMessage("");
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.metaKey || e.ctrlKey) {
        const textarea = e.target as HTMLTextAreaElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        // 手动插入换行符
        setMessage(
          (prev) => prev.substring(0, start) + "\n" + prev.substring(end)
        );

        // 恢复光标位置到换行符后
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }, 0);
      } else {
        if (e.nativeEvent.isComposing) {
          return;
        }
        handleSubmit();
      }
    }
  };
  useEffect(()=>{
    window.agent.getAgentPrompt().then((prompt) => {
      setOptions(prompt);
    });
  },[])
  return (
    <div className="relative max-w-3xl">
      <Textarea
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
        placeholder="从 origin 开始"
        className="h-40 resize-none w-3xl"
        onKeyDown={handleKeyDown}
      ></Textarea>
      <Select
        value={agentId}
        onValueChange={(value) => {
          setAgentId(value);
        }}
      >
        <SelectTrigger className="absolute left-3 bottom-3 w-[100px]">
          <SelectValue placeholder="未设定" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {
              options.map(item=>{
                  return <SelectItem key={item.id} value={String(item.id)}>{item.agentName}</SelectItem>;
              })
            }
          </SelectGroup>
        </SelectContent>
      </Select>
      {!!message && (
        <button
          className="absolute right-3 bottom-3 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleSubmit}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z" />
          </svg>
        </button>
      )}
    </div>
  );
}
