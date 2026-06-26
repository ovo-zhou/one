import { getAdminComments } from "../../../actions/comment/getAdminComments";
import CommentTable from "../../../components/CommentTable";

export default async function AdminCommentsPage() {
  const initialData = await getAdminComments({ maxResults: 20 });
  return <CommentTable initialData={initialData} />;
}
