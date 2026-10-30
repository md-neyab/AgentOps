import { WebhookTester } from "@/components/webhook-tester";

export default function SettingsPage() {
  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center w-full min-h-screen">
      <div className="w-full max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Settings & Simulator
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Test incident simulations or connect external webhooks
          </p>
        </div>

        <WebhookTester />
      </div>
    </div>
  );
}
