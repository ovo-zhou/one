"use client";

import { useEffect} from "react";
import { useRouter } from "next/navigation";
import MarkdownRender from "@/components/markdown/MarkdownRender";
import { createPost, getPostById, updatePost } from "@/actions";
import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
const postSchema = z.object({
  type: z.enum(["post", "page"]),
  title: z
    .string()
    .min(1, { message: "标题不能为空" })
    .max(100, { message: "标题长度不超过 100 个字符" }),
  content: z
    .string()
    .min(1, { message: "内容不能为空" })
    .max(1024 * 10, { message: "内容长度不超过 1024*10 个字符" }),
  abstract: z.string().optional(),
});

export default function Page() {
  const form = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: {
      type: "post",
      title: "",
      content: "",
      abstract: "",
    },
  });
  const searchParams = useSearchParams();
  const postId = searchParams.get("postId");
  const router = useRouter();
  const handleSave = async (values) => {
    // console.log("post", values);
    // 创建
    if (!postId) {
      const data = await createPost(values);
      if (data && data.id) {
        router.push(`/admin/post/list`);
      }
    } else {
      // 编辑
      const data = await updatePost(postId, values);
      if (data && data.id) {
        router.push(`/admin/post/list`);
      }
    }
  };
  useEffect(() => {
    if (postId) {
      // 查询post
      getPostById(postId).then((post) => {
        // console.log("post", post);
        form.setValue("type", post.type);
        form.setValue("title", post.title);
        form.setValue("content", post.content);
        form.setValue("abstract", post.abstract);
      });
    }
  }, [postId, form.setValue]);
  return (
    <div className="flex gap-4">
      <div className="w-full lg:w-1/4 h-screen">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSave)}
            className="flex flex-col gap-4 p-4"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>博客类型</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="博客类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          {
                            label: "博客",
                            value: "post",
                          },
                          {
                            label: "页面",
                            value: "page",
                          },
                        ].map((option) => {
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>标题</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              name="abstract"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>摘要</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="content"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>内容</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="h-200" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">提交</Button>
          </form>
        </Form>
      </div>
      <div className="flex-1 h-screen overflow-auto pt-2 hidden lg:block">
        <MarkdownRender>{form.watch("content")}</MarkdownRender>
      </div>
    </div>
  );
}
