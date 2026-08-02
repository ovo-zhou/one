import { getAdminPostById } from "../../../../../actions/post/getAdminPostById";
import { Title, Box } from "@mantine/core";
import EditPostForm from "./EditPostForm";

export default async function EditPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const post = await getAdminPostById(postId);

  return (
    <Box>
      <Title order={2} mb="lg">编辑文章</Title>
      <EditPostForm
        postId={postId}
        initialTitle={post.title || ""}
        initialContent={post.content || ""}
        initialLabels={post.labels || []}
        initialStatus={post.status ?? undefined}
      />
    </Box>
  );
}
