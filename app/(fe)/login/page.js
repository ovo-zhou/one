"use client";
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
  return (
    <>
      <div className="w-96 mx-auto my-[30%] border p-10 rounded-md">
        <div className="mb-3">
          <div className="w-20 inline-block">用户名：</div>
          <input
            className="border rounded-md"
            type="text"
            name="username"
            value={user.username}
            onChange={handleValueChange}
          />
        </div>
        <div className="mb-3">
          <div className="w-20 inline-block">密码：</div>
          <input
            className="border rounded-md"
            type="password"
            name="password"
            value={user.password}
            onChange={handleValueChange}
          />
        </div>
        <div>
          <button
            className="border px-3 py-1 rounded-md bg-blue-500 text-white"
            onClick={handleLogin}
          >
            登陆
          </button>
        </div>
      </div>
    </>
  );
}
