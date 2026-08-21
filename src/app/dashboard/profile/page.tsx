import { getProfile } from "@/lib/data";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const profile = await getProfile();
  return <ProfileForm initialProfile={profile} />;
}
