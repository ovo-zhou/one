"use client";
import { Tektur } from "next/font/google";
import { useState } from "react";

export default function Page() {
  const [user, setUser] = useState({
    username: "",
    password: "",
  });
  const handleValueChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setUser({ ...user, [name]: value });
  };
  const handleLogin = () => {
    fetch("/login/api", {
      method: "POST",
      body: JSON.stringify(user),
      credentials: "same-origin",
    })
      .then((res) => res.json())
      .then((res) => {
        const { code, message } = res;
        //登陆成功
        if (code === 0) {
          const pathname = new URL(location.href).searchParams.get("pathname");
          location.href = location.origin + pathname;
        }
        // 登陆失败
        if (code === -1) {
          alert(message);
        }
      })
      .catch((err) => {
        alert(err);
      });
  };
  // return (
  //   <>
  //     <div className="w-96 mx-auto my-[30%] border p-10 rounded-md">
  //       <div className="mb-3">
  //         <div className="w-20 inline-block">用户名：</div>
  //         <input
  //           className="border rounded-md px-2 py-1"
  //           type="text"
  //           name="username"
  //           value={user.username}
  //           onChange={handleValueChange}
  //         />
  //       </div>
  //       <div className="mb-3">
  //         <div className="w-20 inline-block">密码：</div>
  //         <input
  //           className="border rounded-md px-2 py-1"
  //           type="password"
  //           name="password"
  //           value={user.password}
  //           onChange={handleValueChange}
  //         />
  //       </div>
  //       <div>
  //         <button
  //           className="border px-3 py-1 rounded-md bg-blue-500 text-white"
  //           onClick={handleLogin}
  //         >
  //           登陆
  //         </button>
  //       </div>
  //     </div>
  //   </>
  // );
  const handleToGitHubAuthorize = () => {
    // https://www.ryandev.cn/authorize?code=c2d29b4a74910bfbaf08
    const url =
      "https://github.com/login/oauth/authorize?client_id=Ov23lip5jG5LIRef8yS4&redirect_uri=https://www.ryandev.cn/authorize";
    window.location.href = url;
  };
  return (
    <div
      className="flex justify-center items-center flex-col gap-6"
      style={{ height: "calc(100vh - 6rem)" }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        fill="currentColor"
        className="bi bi-github"
        viewBox="0 0 16 16"
      >
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
      </svg>
      <div
        className="bg-black text-white px-4 py-2 rounded-md cursor-pointer"
        onClick={handleToGitHubAuthorize}
      >
        GitHub OAuth 登录
      </div>
    </div>
  );
}
