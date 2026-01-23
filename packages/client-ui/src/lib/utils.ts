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
/**
 * 解析 json 字符串
 * 如果不是深度解析，直接调用 JSON.parse
 * 如果是深度解析，将str字符串中所有的字符串递归解析
 */
export function parseJSON(str: string, deepParse: boolean = false) {
  if (!str.trim()) {
    return null;
  }
  if (!deepParse) {
    return JSON.parse(str);
  }
  const parsed = JSON.parse(str);
  Object.keys(parsed).forEach((key) => {
    //只对字符串递归解析
    if (typeof parsed[key] === 'string') {
      parsed[key] = parseJSON(parsed[key], deepParse);
    }
  });
  return parsed;
}
// 测试用例
// {
//   "code": "NORMAL",
//     "result": {
//     "BacklogDetails": [
//       {
//         "BacklogActions": [
//           {
//             "ActionName": "去解决",
//             "ActionParam": "{\"url\":\"/env/qps-limit?resourceType=CloudStaticHosting\"}",
//             "ActionType": "navigation"
//           }
//         ],
//         "Module": "StaticHosting",
//         "Name": "IPRateLimit",
//         "Priority": 99,
//         "Subtitle": "静态托管超频限制未开启",
//         "Title": "建议开启静态环境托管 IP访问限制，有效防止资源被滥用、盗用和异常调用，保障成本可控性",
//         "Type": "Security",
//         "UpdateTime": "2026-01-09 15:24:33"
//       },
//       {
//         "BacklogActions": [
//           {
//             "ActionName": "去解决",
//             "ActionParam": "{\"url\":\"/db/doc/setting\"}",
//             "ActionType": "navigation"
//           }
//         ],
//         "Module": "FlexDb",
//         "Name": "FlexDbDedicated",
//         "Priority": 96,
//         "Subtitle": "云开发自带实例为共享实例，可能存在算力抢占，可升级独占实例",
//         "Title": "当前环境仅可使用共享型文档云数据库，存在算力抢占风险，可能影响数据库使用性能",
//         "Type": "Security",
//         "UpdateTime": "2026-01-09 15:24:33"
//       }
//     ],
//       "RequestId": "e11539e7-fb6d-4743-9b9a-203c8cd0a97a",
//         "Total": 2
//   },
//   "reqId": "f2653d62-0efd-46f6-809c-a7eb7bdba8aa"
// }