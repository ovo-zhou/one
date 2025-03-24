"use client";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import Modal from "@/app/components/modal";

export default function Page() {
  const [dataSource, setDataSource] = useState({ total: 1 });
  const [isShow, setIsShow] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [searchParams, setSearchParams] = useState({
    kind: "",
    title: "",
    page: 1,
    pageSize: 10,
  });
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
    fetch(`/admin/post/delete/${selectedItemId}`, {
      method: "DELETE",
      credentials: "same-origin",
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        closeModal();
        handleSearch();
      })
      .catch((err) => console.log(err));
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
    const queryParams = Object.keys(searchParams)
      .filter((item) => !!searchParams[item])
      .map((item) => {
        return item + "=" + searchParams[item];
      })
      .join("&");
    fetch(`/admin/post/list/api?${queryParams}`, {
      method: "GET",
      credentials: "same-origin",
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        setDataSource(res);
      })
      .catch((err) => {
        // console.log(err);
      });
  };
  useEffect(() => {
    handleSearch();
  }, []);
  return (
    <>
      <NextLink
        href="/admin/post/create"
        className="border inline-block text-white bg-blue-500 rounded-md px-3 py-1"
      >
        写博客
      </NextLink>
      <div className="py-3">
        <label htmlFor="kind">类型:</label>
        <select name="kind" onChange={handleChange}>
          <option value="">全部</option>
          <option value="post">博客</option>
          <option value="page">页面</option>
        </select>
        <label htmlFor="kind">标题:</label>
        <input
          id="title"
          name="title"
          value={searchParams.title}
          onChange={handleChange}
          className="border rounded-md"
        />
        <button
          onClick={handleSearch}
          className="border inline-block text-white bg-blue-500 rounded-md px-3 py-1"
        >
          搜索
        </button>
      </div>
      <table className="table-auto border-collapse border rounded-md">
        <thead className="leading-10 bg-gray-200">
          <tr>
            <th>ID</th>
            <th>标题</th>
            <th>类型</th>
            <th>更新时间</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {dataSource?.data?.map((post) => {
            return (
              <tr key={post.id} className="leading-10">
                <td className="px-2">{post.id}</td>
                <td className="px-2">{post.title}</td>
                <td className="px-2">{post.kind}</td>
                <td className="px-2">{post.updated}</td>
                <td className="px-2">{post.published}</td>
                <td className="px-2">
                  <NextLink
                    href={`/admin/post/edit/${post.id}`}
                    className="text-blue-500 px-2"
                  >
                    编辑
                  </NextLink>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-red-500 px-2"
                  >
                    删除
                  </button>
                  <NextLink
                    href={`/post/${post.id}`}
                    className="text-blue-500 px-2"
                  >
                    查看
                  </NextLink>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
