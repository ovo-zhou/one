
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
interface IAgentPrompt {
  id:number;
  agentName: string;
  prompt: string;
}
export default function Prompt() {
  const [prompt, setPrompt] = useState<IAgentPrompt[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    const getAgentPrompt = async () => {
      const agentPrompt = await window.agent.getAgentPrompt();
      console.log(agentPrompt);
      setPrompt(agentPrompt);
    };
    getAgentPrompt();
  }, []);
  const handleSubmit=()=>{
    window.agent.updateAgentPrompt(prompt).then(res=>{
      console.log(res);
    });
  }
  return (
    <>
      <div onClick={() => navigate("/setting")}>返回</div>
      {prompt.map((item) => {
        return (
          <>
            <div className="grid gap-3">
              <Label htmlFor="name-1">角色</Label>
              <Input id="name-1" name="name" defaultValue={item.agentName} />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="username-1">提示词</Label>
              <Textarea
                id="username-1"
                name="username"
                defaultValue={item.prompt}
              />
            </div>
          </>
        );
      })}
    </>
  );
}
