import { getNotifications } from "@/lib/data";
import { NotificationsList } from "@/components/notifications-list";

export default async function NotificationsPage() {
  const items = await getNotifications();
  return <NotificationsList initial={items} />;
}
