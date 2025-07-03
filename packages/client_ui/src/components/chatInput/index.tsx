import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const FormSchema = z.object({
  message: z.string().max(1024 * 10, {
    message: "输入长度超限",
  }),
  agentType: z.string(),
});
interface IProps {
  submit: (formValues: z.infer<typeof FormSchema>) => undefined;
}
export default function ChatInput(props:IProps){
  const {submit}=props;
    const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
      defaultValues: {
        message: "",
        agentType: "",
      },
    });
    const onSubmit = (formValues: z.infer<typeof FormSchema>) => {
      submit(formValues);
    };
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="relative max-w-3xl">
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="w-3xl">
                <FormControl>
                  <Textarea
                    {...field}
                    autoFocus
                    placeholder="从 origin 开始"
                    className="h-40 resize-none"
                  ></Textarea>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="agentType"
            render={({ field }) => (
              <FormItem className="absolute bottom-3 left-3">
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-[80px]">
                        <SelectValue placeholder="角色" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="normal">通用</SelectItem>
                        <SelectItem value="apple">编程</SelectItem>
                        <SelectItem value="banana">翻译</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          <button
            type="submit"
            className="absolute right-3 bottom-3 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
        </form>
      </Form>
    );
}