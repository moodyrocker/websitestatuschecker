import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Gauge,
} from "lucide-react";

interface SummaryPanelProps {
  isComplete?: boolean;
  isSuccess?: boolean;
  totalResponseTime?: number;
  errorMessage?: string;
}

const SummaryPanel = ({
  isComplete = false,
  isSuccess = false,
  totalResponseTime = 0,
  errorMessage = "",
}: SummaryPanelProps) => {
  // Format the response time to show in ms or seconds as appropriate
  const formattedResponseTime =
    totalResponseTime > 1000
      ? `${(totalResponseTime / 1000).toFixed(2)}s`
      : `${totalResponseTime}ms`;

  // Determine performance rating
  const getPerformanceRating = () => {
    if (!isComplete || !isSuccess) return null;

    if (totalResponseTime < 1000) {
      return {
        label: "Excellent",
        color: "text-green-600 dark:text-green-400",
      };
    } else if (totalResponseTime < 2000) {
      return { label: "Good", color: "text-blue-600 dark:text-blue-400" };
    } else if (totalResponseTime < 3000) {
      return {
        label: "Average",
        color: "text-yellow-600 dark:text-yellow-400",
      };
    } else {
      return { label: "Slow", color: "text-orange-600 dark:text-orange-400" };
    }
  };

  const performanceRating = getPerformanceRating();

  return (
    <Card
      className={`w-full bg-card mt-4 ${isComplete ? (isSuccess ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500") : "border-t-2 border-t-primary"}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Summary</span>
          {isComplete ? (
            <Badge
              variant={isSuccess ? "default" : "destructive"}
              className={`text-sm px-3 py-1 ${isSuccess ? "bg-green-500 hover:bg-green-600" : ""}`}
            >
              {isSuccess ? "UP" : "DOWN"}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-sm px-3 py-1 animate-pulse"
            >
              PENDING
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">
                Total Response Time:
              </span>
            </div>
            <span className="font-medium">
              {isComplete ? formattedResponseTime : "--"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isComplete ? (
                isSuccess ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="text-muted-foreground">Status:</span>
            </div>
            <span className="font-medium">
              {isComplete
                ? isSuccess
                  ? "All checks passed successfully"
                  : errorMessage || "One or more checks failed"
                : "Checks in progress..."}
            </span>
          </div>

          {performanceRating && (
            <div className="flex items-center justify-between pt-2 mt-2 border-t">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-blue-500" />
                <span className="text-muted-foreground">Performance:</span>
              </div>
              <span className={`font-medium ${performanceRating.color}`}>
                {performanceRating.label}
              </span>
            </div>
          )}
        </div>

        {isComplete && !isSuccess && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <span>
                {errorMessage ||
                  "The website appears to be down or unreachable. Please check the URL and try again, or try again later."}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryPanel;
