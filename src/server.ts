import { Webhooks } from "@octokit/webhooks";
import { handleCommand } from "./commands";
import * as http from "http";

const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET || "change-me"
});

webhooks.on("issue_comment.created", async ({ payload }) => {
  const body = payload.comment.body || "";
  const repo = payload.repository.full_name;
  const issueNumber = payload.issue.number;

  if (!body.trim().startsWith("/terminal")) return;

  console.log(\[terminal] \#\: \\);
  await handleCommand({ body, repo, issueNumber });
});

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/webhooks") {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", async () => {
      try {
        const id = req.headers["x-github-delivery"] as string;
        const name = req.headers["x-github-event"] as string;
        const signature = req.headers["x-hub-signature-256"] as string;

        await webhooks.verifyAndReceive({
          id,
          name,
          payload: body,
          signature
        });

        res.statusCode = 200;
        res.end("OK");
      } catch (e) {
        console.error(e);
        res.statusCode = 500;
        res.end("Error");
      }
    });
  } else {
    res.statusCode = 200;
    res.end("CyberAi Terminal");
  }
});

server.listen(port, () => {
  console.log(\Server running on port \\);
});
