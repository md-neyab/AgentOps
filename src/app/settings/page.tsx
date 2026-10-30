import { WebhookTester } from "@/components/webhook-tester";

export default function SettingsPage() {
  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Settings & Simulator
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">
          Test incident simulations or connect external webhooks
        </p>
      </div>

      <WebhookTester />
    </div>
  );
}
