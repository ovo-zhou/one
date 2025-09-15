import { app } from "@/tcb";
import { pageSize } from "@/tcb/models/constants";

const { models } = app;

interface Post {
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

interface PostList {
  records: Post[];
  total?: number;
}

export const getPostList: () => Promise<PostList> = async () => {
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
      envType: "prod",
    });
    return data;
  } catch {
    return null;
  }
};