import { getGrades } from "@/lib/data";
import { GpaCalculator } from "@/components/gpa-calculator";

export default async function GpaPage() {
  const grades = await getGrades();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">GPA Calculator</h1>
      <GpaCalculator initialGrades={grades} />
    </div>
  );
}
