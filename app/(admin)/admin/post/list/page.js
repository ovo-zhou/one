"use client";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { getPostList, deletePost, changeDeleteStatus } from "@/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import dayjs from "dayjs";
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
import { Badge } from "@/components/ui/badge";

export default function Page() {
  const [dataSource, setDataSource] = useState({ total: 1 });
  const [searchParams, setSearchParams] = useState({
    type: "",
    title: "",
    page: 1,
    pageSize: 10,
  });
  const router = useRouter();
  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setSearchParams({
      ...searchParams,
      [name]: value,
    });
  };

  // 删除一条post
  const deleteRecord = (id) => {
    deletePost(id).then(() => {
      handleSearch();
    });
  };

  // 上线/下线
  const handleChangeDeleteStatus = async (id) => {
    const data = await changeDeleteStatus(id);
    await handleSearch();
    // console.log(data);
  };
  const changaPage = (increment) => {
    const page = searchParams.page + increment;
    if (page <= 0 || page > dataSource.total) {
      return;
    }
    setSearchParams((pre) => {
      pre.page = page;
      handleSearch();
      return { ...pre };
    });
  };
  const handleSearch = () => {
    getPostList(searchParams).then((data) => {
      setDataSource(data);
    });
  };
  useEffect(() => {
    handleSearch();
  }, []);
  return (
    <>
      <div className="py-3 flex gap-4 items-center">
        <div className="flex gap-4 items-center">
          <label className="w-10">类型:</label>
          <Select
            onValueChange={(value) => {
              handleChange({ target: { name: "type", value } });
            }}
          >
            <SelectTrigger className="w-[180px]">
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
        </div>
        <div className="flex gap-4 items-center">
          <label className="w-20">标题:</label>
          <Input
            id="title"
            value={searchParams.title}
            onChange={handleChange}
          />
        </div>
        <Button onClick={handleSearch}>搜索</Button>
      </div>
      <Button
        onClick={() => {
          router.push("/admin/post/createEditForm");
        }}
      >
        新建博客
      </Button>
      <div className="overflow-x-auto w-max">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>标题</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataSource?.data?.map((post) => {
              return (
                <TableRow key={post.id} className="leading-10">
                  <TableCell className="px-2">{post.id}</TableCell>
                  <TableCell className="px-2">{post.title}</TableCell>
                  <TableCell className="px-2">{post.type}</TableCell>
                  <TableCell className="px-2">
                    {dayjs(+post.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
                  </TableCell>
                  <TableCell className="px-2">
                    {dayjs(+post.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                  </TableCell>
                  <TableCell className="px-2">
                    {post.isDeleted ? (
                      <Badge
                        variant="destructive"
                      >
                        隐藏
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-blue-500 text-white dark:bg-blue-600"
                      >
                        发布
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-2">
                    <Button
                      onClick={() => handleChangeDeleteStatus(post.id)}
                      variant="link"
                      className="text-blue-500 px-2"
                    >
                      {post.isDeleted ? "上线" : "下线"}
                    </Button>
                    <Button variant="link">
                      <NextLink
                        href={`/admin/post/createEditForm?postId=${post.id}`}
                        className="text-blue-500 px-2"
                      >
                        编辑
                      </NextLink>
                    </Button>
                    <Button variant="link">
                      <NextLink
                        href={`/post/${post.id}`}
                        className="text-blue-500 px-2"
                      >
                        查看
                      </NextLink>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger className="text-destructive">
                          删除
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            确认删除{post.type === "post" ? "博客" : "页面"}吗?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            删除后将无法恢复，请谨慎操作。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              deleteRecord(post.id);
                            }}
                          >
                            确认
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="py-2 flex gap-4">
        <div onClick={() => changaPage(-1)} className="text-blue-500">
          上一页
        </div>
        {searchParams.page}
        <div onClick={() => changaPage(1)} className="text-blue-500">
          下一页
        </div>
        <div>
          每页 {searchParams.pageSize} 条 共 {dataSource.total} 页
        </div>
      </div>
    </>
  );
}
