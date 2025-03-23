import React, { useState, useEffect, useRef } from "react";
import CheckStageList from "./CheckStageList";
import SummaryPanel from "./SummaryPanel";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { ExternalLink, Globe } from "lucide-react";
import { ensureProtocol, saveCheckToHistory } from "../utils/networkUtils";

export interface CheckStage {
  id: string;
  name: string;
  status: "idle" | "loading" | "success" | "error";
  timestamp?: string;
  durationMs?: number;
  errorDetails?: string;
}

interface StatusDashboardProps {
  url?: string;
  isChecking?: boolean;
  onCheckComplete?: (success: boolean, totalTime: number) => void;
  onStopCheck?: () => void;
}

const StatusDashboard = ({
  url = "",
  isChecking = false,
  onCheckComplete = () => {},
  onStopCheck = () => {},
}: StatusDashboardProps) => {
  const [isStopped, setIsStopped] = useState(false);
  const [stages, setStages] = useState<CheckStage[]>([
    { id: "dns", name: "DNS Resolution", status: "idle" },
    { id: "connection", name: "Connection Establishment", status: "idle" },
    { id: "tls", name: "TLS Handshake", status: "idle" },
    { id: "firstByte", name: "First Byte Received", status: "idle" },
    { id: "download", name: "Complete Download", status: "idle" },
  ]);

  const [isComplete, setIsComplete] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [totalResponseTime, setTotalResponseTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState(0);

  // Add a ref to store the reader for cancellation
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(
    null,
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset the dashboard when a new check starts
  useEffect(() => {
    if (isChecking && url) {
      // Reset all states when a new check begins
      setStages([
        { id: "dns", name: "DNS Resolution", status: "loading" },
        { id: "connection", name: "Connection Establishment", status: "idle" },
        { id: "tls", name: "TLS Handshake", status: "idle" },
        { id: "firstByte", name: "First Byte Received", status: "idle" },
        { id: "download", name: "Complete Download", status: "idle" },
      ]);
      setIsComplete(false);
      setIsSuccess(false);
      setTotalResponseTime(0);
      setErrorMessage("");
      setProgress(10); // Start progress at 10%
      setIsStopped(false);

      // Create a new AbortController for this request
      abortControllerRef.current = new AbortController();

      // Perform server-side website checks
      performServerChecks(url);
    }

    // Cleanup function to cancel any ongoing requests when component unmounts or when a new check starts
    return () => {
      if (readerRef.current) {
        readerRef.current.cancel("Request cancelled").catch(console.error);
        readerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [isChecking, url]);

  // Handle stopping the checks
  const handleStopChecks = () => {
    // Cancel the reader if it exists
    if (readerRef.current) {
      readerRef.current.cancel("Check stopped by user").catch(console.error);
      readerRef.current = null;
    }

    // Abort the fetch request if it's still in progress
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsStopped(true);
    setIsComplete(true);
    setErrorMessage("Check stopped by user");
    setProgress(100);
    onStopCheck();

    // Save stopped check to history
    saveCheckToHistory({
      url: url,
      timestamp: new Date().toLocaleString(),
      success: false,
      responseTime: totalResponseTime,
      errorMessage: "Check stopped by user",
    });
  };

  // This function performs server-side website status checks
  const performServerChecks = async (targetUrl: string) => {
    // Let the server handle URL processing
    const processedUrl = targetUrl;

    try {
      // Call the server API to check the website status with the AbortController signal
      const response = await fetch("/api/check-website", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: processedUrl }),
        signal: abortControllerRef.current?.signal,
      });

      // Set up a reader to process the stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      // Store the reader in the ref for potential cancellation
      readerRef.current = reader;

      // Process the stream
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        // Check if the user has stopped the checks
        if (isStopped) {
          reader.cancel();
          break;
        }

        try {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete messages in the buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

          for (const line of lines) {
            if (line.trim()) {
              try {
                const { type, data } = JSON.parse(line);

                // Update UI based on the received data
                setStages(data.stages);
                setIsComplete(data.isComplete);
                setIsSuccess(data.isSuccess);
                setTotalResponseTime(data.totalResponseTime);
                setErrorMessage(data.errorMessage);

                // Update progress based on stages
                updateProgressFromStages(data.stages);

                // If this is the final update, call onCheckComplete and save to history
                if (type === "final" || data.isComplete) {
                  onCheckComplete(data.isSuccess, data.totalResponseTime);

                  // Save check result to history
                  saveCheckToHistory({
                    url: processedUrl,
                    timestamp: new Date().toLocaleString(),
                    success: data.isSuccess,
                    responseTime: data.totalResponseTime,
                    errorMessage: data.errorMessage || undefined,
                  });
                }
              } catch (e) {
                console.error("Error parsing server response:", e);
              }
            }
          }
        } catch (error: any) {
          // If the error is due to the user stopping the check, just break the loop
          if (isStopped || error.name === "AbortError") {
            break;
          }
          throw error; // Re-throw other errors to be caught by the outer try-catch
        }
      }
    } catch (error: any) {
      // Don't update UI if the error was caused by the user stopping the check
      if (isStopped || error.name === "AbortError") {
        return;
      }

      // Handle any unexpected errors
      console.error("Error performing server checks:", error);
      setErrorMessage(error.message || "Failed to connect to server");
      setIsComplete(true);
      setIsSuccess(false);
      setProgress(100);
      onCheckComplete(false, 0);

      // Save failed check to history
      saveCheckToHistory({
        url: processedUrl,
        timestamp: new Date().toLocaleString(),
        success: false,
        responseTime: 0,
        errorMessage: error.message || "Failed to connect to server",
      });
    } finally {
      // Clear the reader ref
      readerRef.current = null;
    }
  };

  // Update progress based on the stages
  const updateProgressFromStages = (currentStages: CheckStage[]) => {
    const completedStages = currentStages.filter(
      (s) => s.status === "success" || s.status === "error",
    ).length;
    const totalStages = currentStages.length;
    const loadingStage = currentStages.findIndex((s) => s.status === "loading");

    if (loadingStage >= 0) {
      // Calculate progress based on completed stages plus partial progress for the loading stage
      const baseProgress = (completedStages / totalStages) * 100;
      const stageProgress = 20; // Arbitrary progress for a stage in loading state
      setProgress(
        Math.min(Math.round(baseProgress + stageProgress / totalStages), 95),
      );
    } else if (completedStages === totalStages) {
      // All stages completed
      setProgress(100);
    } else {
      // Some stages completed, none loading
      setProgress(Math.round((completedStages / totalStages) * 100));
    }
  };

  // Format URL for display
  const getDisplayUrl = () => {
    if (!url) return "";
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      return urlObj.host + urlObj.pathname + urlObj.search;
    } catch (e) {
      return url;
    }
  };

  // Get protocol for display
  const getProtocol = () => {
    if (!url) return "";
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      return urlObj.protocol.replace(":", "");
    } catch (e) {
      return url.startsWith("http://") ? "http" : "https";
    }
  };

  return (
    <Card className="w-full bg-background shadow-md border">
      <CardContent className="p-6">
        {isChecking && !isStopped && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                Checking website status...
              </span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-2 flex-1" />
              <button
                onClick={handleStopChecks}
                className="px-3 py-1 bg-destructive text-destructive-foreground text-xs font-medium rounded hover:bg-destructive/90 transition-colors"
                aria-label="Stop check"
              >
                Stop
              </button>
            </div>
          </div>
        )}

        {url && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Globe className="mr-2 h-6 w-6 text-primary" />
              Website Status
            </h2>
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded uppercase">
                {getProtocol()}
              </div>
              <p className="text-foreground font-medium break-all">
                {getDisplayUrl()}
              </p>
              <a
                href={url.startsWith("http") ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
                aria-label="Open website in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <CheckStageList stages={stages} isChecking={isChecking} />

          <SummaryPanel
            isComplete={isComplete}
            isSuccess={isSuccess}
            totalResponseTime={totalResponseTime}
            errorMessage={errorMessage}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusDashboard;
