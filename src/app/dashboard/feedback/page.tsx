import { getFeedback } from "@/lib/data";
import { FeedbackForm } from "@/components/feedback-form";

export default async function FeedbackPage() {
  const items = await getFeedback();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Feedback</h1>
        <p className="text-sm text-neutral-500">
          Spotted something off, or have an idea to improve the app? Send it straight to the developer.
        </p>
      </div>
      <FeedbackForm initialItems={items} />
    </div>
  );
}
