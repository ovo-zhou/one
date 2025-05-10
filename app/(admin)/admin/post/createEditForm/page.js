"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownRender from "@/app/components/markdown/MarkdownRender";
import Image from "next/image";
import MarkdownEditor from "@/app/components/markdown/MarkdownEditor";
import { createPost, getPostById, updatePost } from "@/app/actions";
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
  const [imgBedVisiable, setImgBedVisiable] = useState(false);
  const uploadElementRef = useRef(null);

  const [imgUrl, setImgUrl] = useState("");
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
  const handleImgUpload = () => {
    const files = uploadElementRef.current.files;
    if (files.length === 0) {
      return;
    }
    const form = new FormData();
    form.append("file", files[0]);
    fetch("/admin/imgs/api", {
      method: "POST",
      body: form,
      credentials: "same-origin",
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        setImgUrl(res.url);
      });
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
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSave)}
          className="flex flex-col gap-4 w-full sm:w-1/2 p-4"
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
                  <Textarea {...field} className="h-96" />
                  {/* <MarkdownRender>{field.value}</MarkdownRender> */}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">提交</Button>
        </form>
      </Form>

      {
        imgBedVisiable ? (
          <div className={styles.imgUploadModal}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>图床</span>
              <span
                onClick={() => setImgBedVisiable(false)}
                style={{ color: "red" }}
              >
                X
              </span>
            </div>
            <input type="file" ref={uploadElementRef} />
            <div>
              <div>图片地址：{imgUrl}</div>
              <Image src={imgUrl} alt="" width={100} height={100} />
            </div>
            <button onClick={handleImgUpload}>上传</button>
            <button onClick={() => setImgBedVisiable(false)}>取消</button>
          </div>
        ) : null
        // <div onClick={() => setImgBedVisiable(true)}>图床</div>
      }
    </>
  );
}
