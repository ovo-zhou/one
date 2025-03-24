"use client";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
export default function Authorize() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  useEffect(() => {
    fetch("/login/api", {
      method: "POST",
      body: JSON.stringify({ code }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        // console.log(res);
      });
  }, [code]);
  if (!code) {
    <div>授权码不存在</div>;
  }
  return <div>登录授权中</div>;
}
