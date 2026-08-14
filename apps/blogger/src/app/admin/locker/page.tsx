import { listActiveFiles } from "../../../lib/locker";
import LockerTable from "../../../components/LockerTable";

export const dynamic = "force-dynamic";

export default async function AdminLockerPage() {
  const initialItems = await listActiveFiles();
  return (
    <LockerTable
      initialItems={initialItems.map((f) => ({
        code: f.code,
        fileName: f.fileName,
        size: f.size,
        uploadedAt: f.uploadedAt,
        remainingMs: f.remainingMs,
      }))}
    />
  );
}