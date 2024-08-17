"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownRender from "@/app/components/markdown/MarkdownRender";

export default function Page({ params }) {
  const { id } = params;
  const [post, setPost] = useState({
    kind: "post",
    title: "",
    content: "",
    abstract: "",
  });
  const router = useRouter();
  const handleSave = () => {
    const date = +new Date() + "";
    const data = Object.assign(post, { updated: date });
    fetch(`/admin/post/edit/${id}/api`, {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "same-origin",
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        console.log("创建成功", res);
        router.back();
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setPost({ ...post, [name]: value });
  };
  useEffect(() => {
    fetch(`/admin/post/edit/${id}/api`, {
      method: "GET",
      credentials: "same-origin",
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        setPost(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [id]);
  return (
    <>
      <form>
        <div>
          <label htmlFor="title">类型:</label>
          <select name="kind" onChange={handleChange} value={post.kind}>
            <option value="post">博客</option>
            <option value="page">页面</option>
          </select>
        </div>
        <div>
          <label htmlFor="title">标题:</label>
          <input
            name="title"
            value={post.title}
            id="title"
            type="text"
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="abstract">摘要:</label>
          <input
            name="abstract"
            value={post.abstract}
            id="abstract"
            type="text"
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="content">内容:</label>
          <div
            style={{ display: "flex", gap: "10px", padding: 10, width: 1200 }}
          >
            <textarea
              style={{
                width: "50%",
                boxSizing: "border-box",
                padding: "10px",
                resize: "none",
              }}
              rows="50"
              name="content"
              value={post.content}
              id="content"
              type="text"
              onChange={handleChange}
            />
            <div
              style={{
                width: "50%",
                boxSizing: "border-box",
                padding: "10px",
                border: "1px solid #ccc",
              }}
            >
              <MarkdownRender>{post.content}</MarkdownRender>
            </div>
          </div>
        </div>
        <div>
          <input type="button" value="保存" onClick={handleSave} />
        </div>
      </form>
    </>
  );
}
