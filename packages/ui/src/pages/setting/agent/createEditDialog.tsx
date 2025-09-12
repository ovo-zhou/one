import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface IProps {
  type: "create" | "edit";
  onOk: (data: z.infer<typeof createFormSchema>) => Promise<void>;
  initData?: z.infer<typeof createFormSchema>;
}

const createFormSchema = z.object({
  id: z.number().optional(),
  agentName: z.string().nonempty("请输入提示词名称"),
  prompt: z.string().nonempty("请输入提示词内容"),
});
export default function CreateEditDialog(props: IProps) {
  const { type, onOk, initData } = props;
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof createFormSchema>>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      id: initData?.id || void 0,
      agentName: initData?.agentName || "",
      prompt: initData?.prompt || "",
    },
  });
  const onSubmit = async (data: z.infer<typeof createFormSchema>) => {
    await onOk?.(data);
    form.reset();
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {type === "create" ? (
          <Button className="cursor-pointer">新增</Button>
        ) : (
          <Button variant="link" className="cursor-pointer">
            编辑
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === "create" ? "新增" : "编辑"}提示词</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
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
              control={form.control}
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
              <DialogClose asChild>
                <Button variant="outline">取消</Button>
              </DialogClose>
              <Button type="submit">保存</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
