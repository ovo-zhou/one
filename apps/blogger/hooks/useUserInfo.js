import { getUserInfo } from "../actions";
import { useEffect, useState } from "react";
export default function useUserInfo() {
  const [userInfo, setUserInfo] = useState({});
  useEffect(() => {
    // 查询用户信息
    getUserInfo().then((data) => {
      setUserInfo(data);
    });
  }, []);
  return {
    userInfo,
    setUserInfo,
  };
}
