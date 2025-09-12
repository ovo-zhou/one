import { useEffect, useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import CreateEditDialog from "./createEditDialog";

interface IAgentPrompt {
  id?: number;
  agentName: string;
  prompt: string;
}

export default function Prompt() {
  const [prompt, setPrompt] = useState<IAgentPrompt[]>([]);

  const queryAgentPrompt = async () => {
    const agentPrompt = await window.agent.getAgentPrompt();
    setPrompt(agentPrompt);
  };
  const createAgentPrompt = async (data: {
    agentName: string;
    prompt: string;
  }) => {
    // 新增提示词
    await window.agent.createAgentPrompt(data);
    await queryAgentPrompt();
  };
  const handleDelete = async (id: number) => {
    await window.agent.deleteAgentPrompt(id);
    queryAgentPrompt();
  };
  const updateAgentPrompt = async (data: IAgentPrompt) => {
    await window.agent.updateAgentPrompt(data);
    await queryAgentPrompt();
  };
  useEffect(() => {
    queryAgentPrompt();
  }, []);
  return (
    <>
      <CreateEditDialog type="create" onOk={createAgentPrompt} />
      {prompt.map((item) => {
        return (
          <Card key={item.id} className="w-xl">
            <CardHeader>
              <CardTitle>{item.agentName}</CardTitle>
              <CardDescription></CardDescription>
              <CardAction>
                <CreateEditDialog
                  type="edit"
                  onOk={updateAgentPrompt}
                  initData={item}
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="link"
                      className="text-destructive cursor-pointer"
                    >
                      删除
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除提示词?</AlertDialogTitle>
                      <AlertDialogDescription>
                        删除后不可恢复！
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(item.id!)}>
                        确认
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p>{item.prompt}</p>
            </CardContent>
            <CardFooter></CardFooter>
          </Card>
        );
      })}
    </>
  );
}
