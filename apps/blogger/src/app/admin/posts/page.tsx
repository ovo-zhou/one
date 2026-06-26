import { getAdminPosts } from "../../../actions/post/getAdminPosts";
import PostTable from "../../../components/PostTable";

export default async function AdminPostsPage() {
  const initialData = await getAdminPosts({ maxResults: 10 });
  return <PostTable initialData={initialData} />;
}
