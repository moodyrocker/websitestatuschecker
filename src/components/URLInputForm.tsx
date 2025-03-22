import React, { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, AlertCircle, Globe, ArrowRight, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface URLInputFormProps {
  onSubmit?: (url: string) => void;
  isLoading?: boolean;
  recentUrls?: string[];
}

const URLInputForm = ({
  onSubmit = () => {},
  isLoading = false,
  recentUrls = [],
}: URLInputFormProps) => {
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popularSites] = useState([
    "google.com",
    "github.com",
    "stackoverflow.com",
    "amazon.com",
  ]);

  // Clear error when URL changes
  useEffect(() => {
    if (error && url) {
      setError("");
    }
  }, [url, error]);

  const validateURL = (input: string): boolean => {
    try {
      // Check if it's a valid URL format
      new URL(input);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    // Prepend http:// if no protocol is specified
    let processedUrl = url;
    if (!/^https?:\/\//i.test(processedUrl)) {
      processedUrl = `http://${processedUrl}`;
    }

    if (validateURL(processedUrl)) {
      setError("");
      setShowSuggestions(false);
      onSubmit(processedUrl);
    } else {
      setError("Please enter a valid URL");
    }
  };

  const handleQuickCheck = (site: string) => {
    const processedUrl = `https://${site}`;
    setUrl(site);
    onSubmit(processedUrl);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-card p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Globe className="mr-2 h-5 w-5 text-primary" /> Website Status Checker
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter website URL (e.g., example.com)"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className={cn(
                "pr-10 pl-4 h-12 text-base",
                error
                  ? "border-destructive focus-visible:ring-destructive"
                  : "",
              )}
              disabled={isLoading}
            />
            {error && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive">
                <AlertCircle size={18} />
              </div>
            )}
          </div>
          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          {showSuggestions && !isLoading && url.trim() === "" && (
            <div className="absolute z-10 mt-1 w-full max-w-3xl bg-popover border rounded-md shadow-lg p-2 animate-in fade-in-50 zoom-in-95">
              {recentUrls.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1 px-2 flex items-center">
                    <History className="h-3 w-3 mr-1" /> Recent
                  </p>
                  <div className="space-y-1">
                    {recentUrls.slice(0, 3).map((recentUrl, idx) => (
                      <button
                        key={`recent-${idx}`}
                        type="button"
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent flex items-center justify-between group"
                        onClick={() =>
                          handleQuickCheck(
                            recentUrl.replace(/^https?:\/\//i, ""),
                          )
                        }
                      >
                        <span className="truncate">{recentUrl}</span>
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 px-2 flex items-center">
                  <Globe className="h-3 w-3 mr-1" /> Popular
                </p>
                <div className="space-y-1">
                  {popularSites.map((site, idx) => (
                    <button
                      key={`popular-${idx}`}
                      type="button"
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent flex items-center justify-between group"
                      onClick={() => handleQuickCheck(site)}
                    >
                      <span>{site}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base font-medium"
          disabled={isLoading || !url.trim()}
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Checking Status...
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              Check Status
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default URLInputForm;
