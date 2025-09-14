import {models} from "@/tcb";
import dayjs from "dayjs";
import Link from "next/link";
const pageSize=200
const blogList = async () => {
  try {
    const { data } = await models.blog.list({
      filter: {
        where: {},
      },
      pageSize, // 分页大小，建议指定，如需设置为其它值，需要和 pageNumber 配合使用，两者同时指定才会生效
      pageNumber: 1, // 第几页
      getCount: true, // 开启用来获取总数
    });
    return data;
  } catch {
    return { records: [],total:0 };
  }
};
// 每隔一小时重新生成一次
export const revalidate = 3600;
export default async function Home() {
  const data = await blogList();
  const { records = []} = data;
  return (
    <main className="container">
      {records?.map((item) => (
        <Link href={`/blog/${item._id}`} key={item._id} className="p-4 cursor-pointer">
          <h1 className="text-3xl font-bold">{item.title}</h1>
          <div className="text-xs text-gray-500 mt-0.5 mb-2 flex justify-start gap-2">
            <div>
              创建于：{dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}
            </div>
            <div>
              最近更新：{dayjs(item.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
            </div>
          </div>
          <div className="text-base mt-2">{item.abstract}</div>
        </Link>
      ))}
    </main>
  );
}
