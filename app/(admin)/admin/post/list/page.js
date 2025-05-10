"use client";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import Modal from "@/app/components/modal";
import { getPostList, deletePost, changeDeleteStatus } from "@/app/actions";
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
export default function Page() {
  const [dataSource, setDataSource] = useState({ total: 1 });
  const [isShow, setIsShow] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
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
  const openModal = () => {
    setIsShow(true);
  };
  const closeModal = () => {
    setIsShow(false);
  };
  const handleDelete = (id) => {
    setSelectedItemId(id);
    openModal();
  };
  // 删除一条post
  const deleteRecord = () => {
    deletePost(selectedItemId).then(() => {
      closeModal();
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
                    {post.isDeleted ? "隐藏" : "发布"}
                  </TableCell>
                  <TableCell className="px-2">
                    <button
                      onClick={() => handleChangeDeleteStatus(post.id)}
                      className="text-blue-500 px-2"
                    >
                      {post.isDeleted ? "上线" : "下线"}
                    </button>
                    <NextLink
                      href={`/admin/post/createEditForm?postId=${post.id}`}
                      className="text-blue-500 px-2"
                    >
                      编辑
                    </NextLink>
                    <NextLink
                      href={`/post/${post.id}`}
                      className="text-blue-500 px-2"
                    >
                      查看
                    </NextLink>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-500 px-2"
                    >
                      删除
                    </button>
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
      <Modal
        title={"提示"}
        open={isShow}
        onOk={deleteRecord}
        onCancel={closeModal}
      >
        删除后不可恢复，确认删除吗？
      </Modal>
    </>
  );
}
