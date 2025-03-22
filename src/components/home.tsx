import React, { useState, useEffect } from "react";
import Header from "./Header";
import URLInputForm from "./URLInputForm";
import StatusDashboard from "./StatusDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Clock, BarChart2, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

const Home = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [url, setUrl] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [activeTab, setActiveTab] = useState("current");
  const [checkHistory, setCheckHistory] = useState<
    Array<{
      url: string;
      timestamp: string;
      success: boolean;
      responseTime: number;
    }>
  >([]);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Auto-switch to current tab when checking starts
  useEffect(() => {
    if (isChecking) {
      setActiveTab("current");
    }
  }, [isChecking]);

  const handleThemeToggle = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleCheckStatus = (inputUrl: string) => {
    setUrl(inputUrl);
    setIsChecking(true);
  };

  const handleCheckComplete = (success: boolean, totalTime: number) => {
    setIsChecking(false);

    // Add to check history
    const now = new Date();
    setCheckHistory((prev) => [
      {
        url,
        timestamp: now.toLocaleString(),
        success,
        responseTime: totalTime,
      },
      ...prev.slice(0, 9), // Keep only the 10 most recent checks
    ]);
  };

  const handleRecheck = () => {
    if (url) {
      setIsChecking(true);
    }
  };

  // Get recent URLs for suggestions
  const recentUrls = checkHistory
    .map((check) => check.url)
    .filter((url, index, self) => self.indexOf(url) === index)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header isDarkMode={isDarkMode} onThemeToggle={handleThemeToggle} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-8">
          <section>
            <URLInputForm
              onSubmit={handleCheckStatus}
              isLoading={isChecking}
              recentUrls={recentUrls}
            />
          </section>

          <section>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <TabsList className="grid w-[400px] grid-cols-2">
                  <TabsTrigger value="current" className="flex items-center">
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Current Check
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="flex items-center"
                    disabled={checkHistory.length === 0}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    History
                    {checkHistory.length > 0 && (
                      <span className="ml-2 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                        {checkHistory.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {url && !isChecking && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRecheck}
                    className="flex items-center"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Recheck
                  </Button>
                )}
              </div>

              <TabsContent value="current" className="mt-0">
                <StatusDashboard
                  url={url}
                  isChecking={isChecking}
                  onCheckComplete={handleCheckComplete}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <div className="bg-card rounded-lg shadow-md border p-6">
                  <h2 className="text-xl font-semibold mb-4">Check History</h2>
                  {checkHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">URL</th>
                            <th className="text-left py-2 px-4">Time</th>
                            <th className="text-left py-2 px-4">Status</th>
                            <th className="text-left py-2 px-4">
                              Response Time
                            </th>
                            <th className="text-left py-2 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {checkHistory.map((check, index) => (
                            <tr
                              key={index}
                              className="border-b hover:bg-muted/50"
                            >
                              <td className="py-2 px-4 truncate max-w-[200px]">
                                {check.url}
                              </td>
                              <td className="py-2 px-4">{check.timestamp}</td>
                              <td className="py-2 px-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${check.success ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}
                                >
                                  {check.success ? "UP" : "DOWN"}
                                </span>
                              </td>
                              <td className="py-2 px-4">
                                {check.responseTime > 1000
                                  ? `${(check.responseTime / 1000).toFixed(2)}s`
                                  : `${check.responseTime}ms`}
                              </td>
                              <td className="py-2 px-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setUrl(check.url);
                                    setIsChecking(true);
                                    setActiveTab("current");
                                  }}
                                  className="h-8 px-2"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No check history available yet.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </main>

      <footer className="py-6 border-t bg-background">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>Website Status Checker &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
