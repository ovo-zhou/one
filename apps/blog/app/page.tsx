import Image from "next/image";
import tcb from "@cloudbase/node-sdk";
const app = tcb.init({
  secretId: process.env.SecretId,
  secretKey: process.env.SecretKey,
  env: "ryan-8gy6kj7jafc56d01",
});
const { models } = app;
const list = async () => {
  try {
    const { data } = await models.blog.list({
      filter: {
        where: {},
      },
      pageSize: 10, // 分页大小，建议指定，如需设置为其它值，需要和 pageNumber 配合使用，两者同时指定才会生效
      pageNumber: 1, // 第几页
      getCount: true, // 开启用来获取总数
    });
    return data;
  } catch {
    return { records: [] };
  }
};

export default async function Home() {
  const data = await list();
  const { records = [] } = data;
  return (
    <>
      <main>
        {records?.map((item) => (
          <div key={item._id}>
            <h2>{item.title}</h2>
          </div>
        ))}
      </main>
      <footer>footer</footer>
    </>
  );
}
