"use client";

import { useState } from "react";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  GitPullRequest, 
  Sparkles
} from "lucide-react";
import { Incident } from "@/lib/types";

interface ApprovalDockProps {
  incident: Incident;
  onStatusUpdated?: (updated: Incident) => void;
}

export function ApprovalDock({ incident, onStatusUpdated }: ApprovalDockProps) {
  const [currentIncident, setCurrentIncident] = useState<Incident>(incident);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/incidents/${currentIncident.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_by: "Alex Chen" }),
      });

      if (!res.ok) {
        throw new Error("Approval failed");
      }

      const data = await res.json();
      const updated: Incident = {
        ...currentIncident,
        status: "approved",
        pr_url: data.pr_url,
        pr_number: data.pr_number,
        pr_branch: data.pr_branch,
        approved_at: data.approved_at,
      };

      setCurrentIncident(updated);
      onStatusUpdated?.(updated);

      toast.success(
        `Fix approved! GitHub Pull Request #${data.pr_number} opened.`,
        {
          description: "Your code hotfix has been sent for review.",
          duration: 5000,
        }
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const res = await fetch(`/api/incidents/${currentIncident.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_reason: "Dismissed by user" }),
      });

      if (!res.ok) {
        throw new Error("Rejection failed");
      }

      const data = await res.json();
      const updated: Incident = {
        ...currentIncident,
        status: "rejected",
        rejected_at: data.rejected_at,
      };

      setCurrentIncident(updated);
      onStatusUpdated?.(updated);

      toast.info("Incident dismissed.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject.");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          {currentIncident.status === "approved" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : currentIncident.status === "rejected" ? (
            <XCircle className="w-5 h-5 text-slate-400" />
          ) : (
            <Sparkles className="w-5 h-5 text-blue-600" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">
              {currentIncident.status === "approved"
                ? "Fix Applied!"
                : currentIncident.status === "rejected"
                ? "Incident Dismissed"
                : "Approve this AI Fix"}
            </h4>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {currentIncident.status === "approved"
              ? "A GitHub Pull Request was automatically created."
              : currentIncident.status === "rejected"
              ? "This error was closed without changes."
              : "Click approve to create a GitHub Pull Request with the fix."}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {currentIncident.status === "pending" ? (
          <>
            <button
              onClick={handleReject}
              disabled={isRejecting || isApproving}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
            >
              {isRejecting ? "Dismissing..." : "Dismiss"}
            </button>

            <button
              onClick={handleApprove}
              disabled={isApproving || isRejecting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating GitHub PR...</span>
                </>
              ) : (
                <>
                  <GitPullRequest className="w-4 h-4" />
                  <span>Approve & Create PR</span>
                </>
              )}
            </button>
          </>
        ) : currentIncident.status === "approved" ? (
          <div className="flex items-center gap-3">
            {currentIncident.pr_url && (
              <a
                href={currentIncident.pr_url}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                <GitPullRequest className="w-4 h-4" />
                <span>View Pull Request #{currentIncident.pr_number || "Open"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        ) : (
          <span className="text-xs font-medium text-slate-500 px-3 py-1.5 rounded-xl bg-slate-100">
            Closed
          </span>
        )}
      </div>
    </div>
  );
}
