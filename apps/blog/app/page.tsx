import dayjs from 'dayjs';
import Link from 'next/link';
import { getPostList } from '@/tcb/models/post';

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getPostList();
  const total = posts?.total ?? 0;
  const totalPages = Math.ceil(total / 10);
  return Array.from({ length: totalPages }, (_, i) => ({
    page: String(i + 1),
  }));
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page: string | undefined }>;
}) {
  // 没有分页参数，默认为第一页
  const { page = 1 } = await searchParams;
  const { records, total } = await getPostList(+page);
  const isMore = () => {
    if ((+page - 1) * 10 + records.length < total!) {
      return true;
    }
    return false;
  };
  return (
    <>
      {records?.map((item) => (
        <div key={item._id} className="cursor-pointer rounded-md mb-20 group">
          <Link href={`/blog/${item._id}`}>
            <h1 className="text-3xl font-bold group-hover:underline decoration-pink-500 underline-offset-4">
              {item.title}
            </h1>
          </Link>

          <div className="text-xs text-gray-500 mt-4 mb-4">
            <div className="mb-2">
              创建于：{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </div>
            <div>
              最近更新：
              {dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
            </div>
          </div>
          <div className="text-base mt-2">{item.abstract}</div>
        </div>
      ))}
      {/* 加载更多 */}
      {isMore() && (
        <div>
          <Link href={`/?page=${+page + 1}`}>加载更多</Link>
        </div>
      )}
    </>
  );
}
