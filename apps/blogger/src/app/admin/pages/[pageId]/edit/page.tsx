import { getPageById } from "../../../../../actions/page/getPageById";
import { Title } from "@mantine/core";
import EditPageForm from "./EditPageForm";

export default async function EditPagePage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const page = await getPageById(pageId);

  return (
    <div>
      <Title order={2} mb="lg">编辑页面</Title>
      <EditPageForm
        pageId={pageId}
        initialTitle={page.title || ""}
        initialContent={page.content || ""}
      />
    </div>
  );
}
