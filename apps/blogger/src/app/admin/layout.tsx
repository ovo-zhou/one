import { redirect } from "next/navigation";
import { getSession } from "../../lib/session";
import AdminShell from "../../components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session || session.email !== process.env.admin_email) {
    redirect("/");
  }

  const userName = session.name || session.email || "管理员";

  return <AdminShell userName={userName}>{children}</AdminShell>;
}
