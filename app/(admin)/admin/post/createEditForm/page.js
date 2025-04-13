"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownRender from "@/app/components/markdown/MarkdownRender";
import Image from "next/image";
import MarkdownEditor from "@/app/components/markdown/MarkdownEditor";
import { createPost, getPostById, updatePost } from "@/app/actions";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const [post, setPost] = useState({
    type: "post",
    title: "",
    content: "",
    abstract: "",
  });
  const searchParams = useSearchParams();
  const postId = searchParams.get("postId");
  const [imgBedVisiable, setImgBedVisiable] = useState(false);
  const uploadElementRef = useRef(null);

  const [imgUrl, setImgUrl] = useState("");
  const router = useRouter();
  const handleSave = async () => {
    // console.log("post", post);
    // 创建
    if (!postId) {
      const data = await createPost(post);
      if (data && data.id) {
        router.push(`/admin/post/list`);
      }
    } else {
      // 编辑
      const data = await updatePost(postId, post);
      if (data && data.id) {
        router.push(`/admin/post/list`);
      }
    }
  };
  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setPost({ ...post, [name]: value });
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
        setPost(post);
      });
    }
  }, [postId]);
  return (
    <>
      <form>
        <div>
          <label htmlFor="type">类型:</label>
          <select name="type" onChange={handleChange} value={post.type}>
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
            <div
              style={{
                width: "50%",
                boxSizing: "border-box",
              }}
            >
              <MarkdownEditor
                value={post.content}
                name="content"
                onChange={handleChange}
              />
            </div>
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
