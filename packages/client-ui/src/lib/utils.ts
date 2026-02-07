import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs from "dayjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTimeGreeting() {
  const hour = dayjs().hour();

  if (hour >= 5 && hour < 12) {
    return ["上午好", '要努力哦～'];
  } else if (hour >= 12 && hour < 14) {
    return ["中午好", "请按时吃饭"];
  } else if (hour >= 14 && hour < 18) {
    return ["下午好", "下午茶与工作更配哦～"];
  } else if (hour >= 18 && hour < 24) {
    return ["晚上好", "记得下班打卡！"];
  } else {
    return ["凌晨好", "夜深了，早点休息吧。"];
  }
}