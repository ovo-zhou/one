import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface IAgentPrompt {
  id: number;
  agentName: string;
  prompt: string;
}
const createFormSchema = z.object({
  agentName: z.string().nonempty("请输入提示词名称"),
  prompt: z.string().nonempty("请输入提示词内容"),
});
export default function Prompt() {
  const [prompt, setPrompt] = useState<IAgentPrompt[]>([]);
  const createForm = useForm<z.infer<typeof createFormSchema>>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      agentName: "",
      prompt: "",
    },
  });
  const queryAgentPrompt = async () => {
    const agentPrompt = await window.agent.getAgentPrompt();
    setPrompt(agentPrompt);
  };
  const onSubmit = async (data: z.infer<typeof createFormSchema>) => {
     await window.agent.createAgentPrompt(data);
     queryAgentPrompt();
  };
  const handleDelete = async (id: number) => {
    await window.agent.deleteAgentPrompt(id);
    queryAgentPrompt();
  };
  useEffect(() => {
    queryAgentPrompt();
  }, []);
  return (
    <>
      <Dialog>
        <DialogTrigger>新增 Prompt</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增 Prompt</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onSubmit)}>
              <FormField
                control={createForm.control}
                name="agentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>提示词名称</FormLabel>
                    <FormControl>
                      <Input placeholder="提示词名称" {...field} />
                    </FormControl>
                    <FormDescription></FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>提示词内容</FormLabel>
                    <FormControl>
                      <Textarea placeholder="提示词内容" {...field} />
                    </FormControl>
                    <FormDescription></FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end mt-4 gap-4">
                <div >取消</div>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {prompt.map((item) => {
        return (
          <Card key={item.id} className="w-xl">
            <CardHeader>
              <CardTitle>{item.agentName}</CardTitle>
              <CardDescription></CardDescription>
              <CardAction>
                <Dialog>
                  <DialogTrigger className="text-blue-500 cursor-pointer">
                    编辑
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>编辑{item.agentName}</DialogTitle>
                      <DialogDescription></DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="secondary">
                          取消
                        </Button>
                      </DialogClose>
                      <Button type="button">保存</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <AlertDialog>
                  <AlertDialogTrigger className="text-red-500 cursor-pointer">
                    删除
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
                      <AlertDialogAction onClick={() => handleDelete(item.id)}>
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
