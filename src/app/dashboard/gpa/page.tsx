import { getGrades, getCourses, getProfile } from "@/lib/data";
import { GpaCalculator } from "@/components/gpa-calculator";

export default async function GpaPage() {
  const [grades, courses, profile] = await Promise.all([getGrades(), getCourses(), getProfile()]);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">GPA Calculator</h1>
      <GpaCalculator initialGrades={grades} courses={courses} defaultSemesterLabel={profile?.semester ?? ""} />
    </div>
  );
}
