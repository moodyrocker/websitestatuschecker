// Simple script to start both client and server
import { spawn } from "child_process";

// Start the server
const server = spawn("node", ["server/index.js"], { stdio: "inherit" });

// Start the client
const client = spawn("npm", ["run", "dev"], { stdio: "inherit" });

// Handle process termination
process.on("SIGINT", () => {
  server.kill();
  client.kill();
  process.exit();
});

server.on("close", (code) => {
  console.log(`Server process exited with code ${code}`);
  client.kill();
  process.exit(code);
});

client.on("close", (code) => {
  console.log(`Client process exited with code ${code}`);
  server.kill();
  process.exit(code);
});
