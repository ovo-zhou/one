import { useNavigate } from "react-router-dom";
import H1 from "@/components/Typography/H1";
import H2 from "@/components/Typography/H2";
import { Button } from "@/components/ui/button";
import Prompt from "./agent/prompt";

export default function Setting() {
  const navigate = useNavigate();
  return (
    <div className="mt-0 mx-auto w-3xl">
      <H1>设置</H1>
      <H2>Agent</H2>
      <Prompt/>
      <Button
        className="w-full"
        variant="secondary"
        onClick={() => {
          navigate("/ ");
        }}
      >
        返回
      </Button>
    </div>
  );
}
