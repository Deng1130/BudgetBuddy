import { requireUser } from "@/lib/auth";
import { SettingsView } from "@/components/settings/settings-view";

export default async function SettingsPage() {
  const user = await requireUser();

  return <SettingsView userEmail={user.email} />;
}
