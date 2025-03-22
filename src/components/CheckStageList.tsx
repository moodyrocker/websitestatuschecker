import React from "react";
import {
  Check,
  X,
  Loader2,
  AlertCircle,
  Server,
  Shield,
  Download,
  Zap,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export type CheckStage = {
  id: string;
  name: string;
  status: "idle" | "loading" | "success" | "error";
  timestamp?: string;
  errorDetails?: string;
  durationMs?: number;
};

interface CheckStageListProps {
  stages?: CheckStage[];
  isChecking?: boolean;
}

const CheckStageList = ({
  stages = [
    { id: "dns", name: "DNS Resolution", status: "idle" },
    { id: "connection", name: "Connection Establishment", status: "idle" },
    { id: "tls", name: "TLS Handshake", status: "idle" },
    { id: "firstByte", name: "First Byte Received", status: "idle" },
    { id: "download", name: "Complete Download", status: "idle" },
  ],
  isChecking = false,
}: CheckStageListProps) => {
  // Get stage descriptions for tooltips
  const getStageDescription = (stageId: string): string => {
    switch (stageId) {
      case "dns":
        return "Resolving domain name to IP address via DNS servers";
      case "connection":
        return "Establishing TCP connection to the server";
      case "tls":
        return "Performing secure TLS/SSL handshake for encrypted communication";
      case "firstByte":
        return "Waiting for the server to send the first byte of data";
      case "download":
        return "Downloading the complete webpage content";
      default:
        return "";
    }
  };

  // Get stage icon
  const getStageIcon = (stageId: string) => {
    switch (stageId) {
      case "dns":
        return <Server className="h-5 w-5 text-blue-500" />;
      case "connection":
        return <Zap className="h-5 w-5 text-yellow-500" />;
      case "tls":
        return <Shield className="h-5 w-5 text-green-500" />;
      case "firstByte":
        return <AlertCircle className="h-5 w-5 text-purple-500" />;
      case "download":
        return <Download className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-background rounded-md border p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Status Checks</h2>
      <div className="space-y-4">
        <TooltipProvider>
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-md border transition-colors",
                stage.status === "loading"
                  ? "bg-primary/5 border-primary/20"
                  : "bg-card hover:bg-card/80",
                stage.status === "error"
                  ? "bg-destructive/5 border-destructive/20"
                  : "",
                stage.status === "success"
                  ? "bg-green-50 border-green-100 dark:bg-green-950/20 dark:border-green-900/30"
                  : "",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <StatusIcon status={stage.status} />
                  <div className="absolute -top-1 -right-1">
                    {stage.status === "idle" && getStageIcon(stage.id)}
                  </div>
                </div>
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="font-medium flex items-center gap-2">
                        {stage.name}
                        {stage.status === "loading" && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full animate-pulse">
                            In progress
                          </span>
                        )}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="max-w-xs">
                        {getStageDescription(stage.id)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  {stage.errorDetails && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {stage.errorDetails}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {stage.timestamp && (
                  <p className="text-sm text-muted-foreground">
                    {stage.timestamp}
                  </p>
                )}
                {stage.durationMs !== undefined && (
                  <p
                    className={cn(
                      "text-sm font-medium",
                      stage.durationMs < 300
                        ? "text-green-600 dark:text-green-400"
                        : "",
                      stage.durationMs >= 300 && stage.durationMs < 800
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "",
                      stage.durationMs >= 800
                        ? "text-orange-600 dark:text-orange-400"
                        : "",
                    )}
                  >
                    {stage.durationMs}ms
                  </p>
                )}
              </div>
            </div>
          ))}
        </TooltipProvider>
      </div>
      {!isChecking && stages.every((stage) => stage.status === "idle") && (
        <div className="mt-6 text-center p-8 border border-dashed rounded-md bg-muted/30">
          <Server className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">
            Enter a URL and click "Check Status" to begin
          </p>
        </div>
      )}
    </div>
  );
};

const StatusIcon = ({ status }: { status: CheckStage["status"] }) => {
  switch (status) {
    case "loading":
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    case "success":
      return <Check className="h-5 w-5 text-green-600 dark:text-green-500" />;
    case "error":
      return <X className="h-5 w-5 text-destructive" />;
    case "idle":
    default:
      return (
        <div className="h-5 w-5 rounded-full border border-muted-foreground/30" />
      );
  }
};

export default CheckStageList;
