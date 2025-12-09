'use server';
import { app } from '@/tcb';
import { pageSize } from '@/tcb/models/constants';

const { models } = app;

export interface Post {
  owner: string;
  createdAt: number;
  createBy: string;
  updateBy: string;
  _openid: string;
  _id: string;
  abstract: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface PostList {
  records: Post[];
  total?: number;
}
/**
 * 获取文章列表
 * @param pageNumber 页码，默认第 1 页
 * @returns 文章列表
 */
export async function getPostList(pageNumber: number = 1): Promise<PostList> {
  try {
    const { data } = await models.blog.list({
      filter: {
        where: {
          visibility: {
            $eq: true,
          },
        },
      },
      pageSize, // 分页大小，建议指定，如需设置为其它值，需要和 pageNumber 配合使用，两者同时指定才会生效
      pageNumber, // 第几页
      getCount: true, // 开启用来获取总数
      envType: 'prod',
    });
    return data;
  } catch {
    return { records: [], total: 0 };
  }
}

export const getPostDetail: (id: string) => Promise<Post> = async (id) => {
  try {
    const { data } = await models.blog.get({
      filter: {
        where: {
          $and: [
            {
              _id: {
                $eq: id,
              },
            },
          ],
        },
      },
      envType: 'prod',
    });
    return data;
  } catch {
    return null;
  }
};
