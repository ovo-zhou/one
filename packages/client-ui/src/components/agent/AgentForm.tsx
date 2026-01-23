import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '../ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '../ui/button';
const formSchema = z.object({
  agentName: z
    .string()
    .min(2, {
      message: 'agentName 至少2个字符',
    })
    .max(30, {
      message: 'agentName 最多30个字符',
    }),
  prompt: z
    .string()
    .min(2, {
      message: 'Prompt 至少2个字符',
    })
    .max(1000, {
      message: 'Prompt 最多1000个字符',
    }),
});
interface AgentFormProps {
  id?: number;
  agentName?: string;
  prompt?: string;
  handleSubmit: () => void;
  handleCancel: () => void;
}
export default function AgentForm(props: AgentFormProps) {
  const { id, agentName = '', prompt = '', handleSubmit, handleCancel } = props;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agentName: agentName,
      prompt: prompt,
    },
  });
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (id) {
      await window.agent.updateAgentPrompt({
        id,
        agentName: values.agentName,
        prompt: values.prompt,
      });
    } else {
      await window.agent.createAgentPrompt({
        agentName: values.agentName,
        prompt: values.prompt,
      });
    }
    handleSubmit();
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="agentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>名称</FormLabel>
              <FormControl>
                <Input placeholder="agent 名称" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>提示词</FormLabel>
              <FormControl>
                <Textarea placeholder="agent 提示词" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              handleCancel();
            }}
          >
            取消
          </Button>
          <Button type="submit">提交</Button>
        </div>
      </form>
    </Form>
  );
}
