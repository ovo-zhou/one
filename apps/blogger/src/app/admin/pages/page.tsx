import { getPages } from "../../../actions/page/getPages";
import PageTable from "../../../components/PageTable";

export default async function AdminPagesPage() {
  const initialData = await getPages({ maxResults: 10 });
  return <PageTable initialData={initialData} />;
}
