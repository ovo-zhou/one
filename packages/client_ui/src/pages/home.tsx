import { Textarea } from "@/components/ui/textarea";
import dayjs from "dayjs";
import { getTimeGreeting } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const [word1, word2] = getTimeGreeting();
export default function Home() {
  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center gap-10">
      <div className="text-7xl font-bold">origin</div>
      <div className="text-2xl font-thin">
        {word1}，今天是 {dayjs().format("YYYY 年 M 月 D 日")}，{word2}
      </div>
      <div className="relative">
        <Textarea
          autoFocus
          placeholder="从 origin 开始"
          className="w-3xl h-40 resize-none text-10xl"
        ></Textarea>
        <div className="absolute left-3 bottom-3">
          <Select>
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="apple">编程</SelectItem>
                <SelectItem value="banana">翻译</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <button disabled className="absolute right-3 bottom-3 disabled:">
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
      </div>
      <div>按钮组合</div>
    </div>
  );
}
