import { models } from "@/tcb";
import dayjs from "dayjs";
export const revalidate = 3600;
const pageSize = 200;
export async function generateStaticParams() {
    const { data } = await models.blog.list({
      filter: {
        where: {},
      },
      pageSize, // 分页大小，建议指定，如需设置为其它值，需要和 pageNumber 配合使用，两者同时指定才会生效
      pageNumber: 1, // 第几页
      getCount: true, // 开启用来获取总数
    });
    const { records = [] } = data;
  return records.map((post) => ({
    id: String(post._id),
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
const { data } = await models.blog.get({
  filter: {
    where: {
      $and: [
        {
          _id: {
            $eq: id, // 推荐传入_id数据标识进行操作
          },
        },
      ],
    },
  },
  // envType: pre 体验环境， prod 正式环境
  envType: "prod",
});
  return (
    <main className="container">
      <h1 className="text-3xl font-bold">{data.title}</h1>
      <div className="text-xs text-gray-500 mt-0.5 mb-2 flex justify-start gap-2">
        <div>创建于：{dayjs(data.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
        <div>
          最近更新：{dayjs(data.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
        </div>
      </div>
      <div className="text-base mt-2">{data.content}</div>
    </main>
  );
}
