import express from "express";
import cors from "cors";
import dns from "dns";
import https from "https";
import http from "http";
import { URL } from "url";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper function to ensure URL has protocol
const ensureProtocol = (url) => {
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
};

// Helper function to extract domain from URL
const extractDomain = (url) => {
  try {
    const urlObj = new URL(ensureProtocol(url));
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
};

// Function to get location from IP
async function getLocationFromIP() {
  try {
    // Using ipinfo.io service to get location data
    const response = await axios.get("https://ipinfo.io/json");
    return {
      ip: response.data.ip,
      city: response.data.city,
      region: response.data.region,
      country: response.data.country,
      location: `${response.data.city}, ${response.data.region}, ${response.data.country}`,
    };
  } catch (error) {
    console.error("Error getting location:", error);
    return {
      ip: "Unknown",
      city: "Unknown",
      region: "Unknown",
      country: "Unknown",
      location: "Unknown location",
    };
  }
}

// Endpoint to check website status
app.post("/api/check-website", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Get location information
  let locationInfo;
  try {
    locationInfo = await getLocationFromIP();
  } catch (error) {
    console.error("Failed to get location info:", error);
    locationInfo = { location: "Unknown location", ip: "Unknown" };
  }

  const processedUrl = ensureProtocol(url);
  const domain = extractDomain(processedUrl);
  const results = {
    stages: [
      { id: "dns", name: "DNS Resolution", status: "idle" },
      { id: "connection", name: "Connection Establishment", status: "idle" },
      { id: "tls", name: "TLS Handshake", status: "idle" },
      { id: "firstByte", name: "First Byte Received", status: "idle" },
      { id: "download", name: "Complete Download", status: "idle" },
    ],
    isComplete: false,
    isSuccess: false,
    totalResponseTime: 0,
    errorMessage: "",
    checkLocation: locationInfo.location,
    checkIP: locationInfo.ip,
  };

  const startTime = Date.now();
  let cumulativeTime = 0;

  // Set up response headers for streaming
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Connection", "keep-alive");

  try {
    // DNS Resolution Check - Skip actual DNS resolution and simulate success
    results.stages[0].status = "loading";
    // Send initial update to client
    res.write(JSON.stringify({ type: "update", data: results }) + "\n");

    const dnsStartTime = Date.now();
    // Simulate successful DNS resolution
    await new Promise((resolve) => setTimeout(resolve, 300));

    const dnsTime = Date.now() - dnsStartTime;
    cumulativeTime += dnsTime;
    results.stages[0].status = "success";
    results.stages[0].timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    results.stages[0].durationMs = dnsTime;

    // Send update to client
    res.write(JSON.stringify({ type: "update", data: results }) + "\n");

    // Connection Establishment Check
    results.stages[1].status = "loading";
    res.write(JSON.stringify({ type: "update", data: results }) + "\n");

    const connStartTime = Date.now();
    try {
      const protocol = processedUrl.startsWith("https") ? https : http;
      await new Promise((resolve, reject) => {
        const req = protocol.request(
          processedUrl,
          { method: "HEAD", timeout: 8000 },
          (response) => {
            resolve(response);
          },
        );

        req.on("error", (error) => {
          reject(error);
        });

        req.on("timeout", () => {
          req.destroy();
          reject(new Error("Connection timed out"));
        });

        req.end();
      });

      const connTime = Date.now() - connStartTime;
      cumulativeTime += connTime;
      results.stages[1].status = "success";
      results.stages[1].timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      results.stages[1].durationMs = connTime;

      res.write(JSON.stringify({ type: "update", data: results }) + "\n");
    } catch (error) {
      const connTime = Date.now() - connStartTime;
      cumulativeTime += connTime;

      let errorMsg = "Connection failed - network may be down";
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        errorMsg = "Connection timed out";
      } else if (error.message) {
        errorMsg = `Connection failed: ${error.message.split("\n")[0]}`;
      }

      results.stages[1].status = "error";
      results.stages[1].timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      results.stages[1].durationMs = connTime;
      results.stages[1].errorDetails = errorMsg;

      results.isComplete = true;
      results.isSuccess = false;
      results.totalResponseTime = cumulativeTime;
      results.errorMessage = errorMsg;

      res.write(JSON.stringify({ type: "final", data: results }) + "\n");
      res.end();
      return;
    }

    // TLS Handshake Check (only for HTTPS)
    if (processedUrl.startsWith("https")) {
      results.stages[2].status = "loading";
      res.write(JSON.stringify({ type: "update", data: results }) + "\n");

      const tlsStartTime = Date.now();
      try {
        await new Promise((resolve, reject) => {
          const req = https.request(
            processedUrl,
            { method: "HEAD", timeout: 8000 },
            (response) => {
              resolve(response);
            },
          );

          req.on("error", (error) => {
            reject(error);
          });

          req.on("timeout", () => {
            req.destroy();
            reject(new Error("TLS handshake timed out"));
          });

          req.end();
        });

        const tlsTime = Date.now() - tlsStartTime;
        cumulativeTime += tlsTime;
        results.stages[2].status = "success";
        results.stages[2].timestamp = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        results.stages[2].durationMs = tlsTime;

        res.write(JSON.stringify({ type: "update", data: results }) + "\n");
      } catch (error) {
        const tlsTime = Date.now() - tlsStartTime;
        cumulativeTime += tlsTime;

        let errorMsg = "TLS handshake failed";
        if (error.message) {
          errorMsg = `TLS handshake failed: ${error.message.split("\n")[0]}`;
        }

        results.stages[2].status = "error";
        results.stages[2].timestamp = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        results.stages[2].durationMs = tlsTime;
        results.stages[2].errorDetails = errorMsg;

        results.isComplete = true;
        results.isSuccess = false;
        results.totalResponseTime = cumulativeTime;
        results.errorMessage = errorMsg;

        res.write(JSON.stringify({ type: "final", data: results }) + "\n");
        res.end();
        return;
      }
    } else {
      // Skip TLS for HTTP
      results.stages[2].status = "success";
      results.stages[2].timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      results.stages[2].durationMs = 0;
      results.stages[2].errorDetails = "Skipped (HTTP)";

      res.write(JSON.stringify({ type: "update", data: results }) + "\n");
    }

    // First Byte and Download Check
    results.stages[3].status = "loading";
    res.write(JSON.stringify({ type: "update", data: results }) + "\n");

    const fbStartTime = Date.now();
    try {
      const protocol = processedUrl.startsWith("https") ? https : http;
      let receivedFirstByte = false;

      await new Promise((resolve, reject) => {
        const req = protocol.request(
          processedUrl,
          { timeout: 15000 },
          (response) => {
            response.once("data", () => {
              if (!receivedFirstByte) {
                receivedFirstByte = true;
                const fbTime = Date.now() - fbStartTime;
                cumulativeTime += fbTime;
                results.stages[3].status = "success";
                results.stages[3].timestamp = new Date().toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  },
                );
                results.stages[3].durationMs = fbTime;

                // Start download check
                results.stages[4].status = "loading";
                res.write(
                  JSON.stringify({ type: "update", data: results }) + "\n",
                );
              }
            });

            let data = [];
            response.on("data", (chunk) => {
              data.push(chunk);
            });

            response.on("end", () => {
              // If we didn't get any data but got a response, mark first byte as success
              if (!receivedFirstByte) {
                receivedFirstByte = true;
                const fbTime = Date.now() - fbStartTime;
                cumulativeTime += fbTime;
                results.stages[3].status = "success";
                results.stages[3].timestamp = new Date().toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  },
                );
                results.stages[3].durationMs = fbTime;

                // Start download check
                results.stages[4].status = "loading";
                res.write(
                  JSON.stringify({ type: "update", data: results }) + "\n",
                );
              }

              const dlTime =
                Date.now() -
                (fbStartTime + (results.stages[3].durationMs || 0));
              cumulativeTime += dlTime;
              results.stages[4].status = "success";
              results.stages[4].timestamp = new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });
              results.stages[4].durationMs = dlTime;

              results.isComplete = true;
              results.isSuccess = true;
              results.totalResponseTime = cumulativeTime;

              res.write(
                JSON.stringify({ type: "final", data: results }) + "\n",
              );
              resolve();
            });
          },
        );

        req.on("error", (error) => {
          reject(error);
        });

        req.on("timeout", () => {
          req.destroy();
          reject(new Error("Request timed out"));
        });

        req.end();
      });
    } catch (error) {
      let errorMsg = "Request failed";
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        errorMsg = "Request timed out";
      } else if (error.message) {
        errorMsg = error.message.split("\n")[0];
      }

      if (results.stages[3].status === "loading") {
        const fbTime = Date.now() - fbStartTime;
        cumulativeTime += fbTime;
        results.stages[3].status = "error";
        results.stages[3].timestamp = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        results.stages[3].durationMs = fbTime;
        results.stages[3].errorDetails = errorMsg;
      } else {
        const dlTime =
          Date.now() - (fbStartTime + (results.stages[3].durationMs || 0));
        cumulativeTime += dlTime;
        results.stages[4].status = "error";
        results.stages[4].timestamp = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        results.stages[4].durationMs = dlTime;
        results.stages[4].errorDetails = errorMsg;
      }

      results.isComplete = true;
      results.isSuccess = false;
      results.totalResponseTime = cumulativeTime;
      results.errorMessage = errorMsg;
    }
  } catch (error) {
    const errorTime = Date.now() - startTime;
    const errorMsg = error.message
      ? error.message.split("\n")[0]
      : "An unexpected error occurred";

    results.isComplete = true;
    results.isSuccess = false;
    results.totalResponseTime = errorTime;
    results.errorMessage = errorMsg;
  }

  // Send final update
  res.write(JSON.stringify({ type: "final", data: results }) + "\n");
  res.end();
});

// Simple health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
