// A special entrypoint for deploying the bot to Fly.io
// See also: https://grammy.dev/hosting/fly.html#setting-the-webhook-url
import * as log from "std/log/mod.ts";
import { serve } from "std/http/server.ts";
import { webhookCallback } from "grammy";
import { bot, setupLogger } from "./bot.ts";

const handleUpdate = webhookCallback(bot, "std/http");
const port = parseInt(Deno.env.get("PORT") ?? "8000");
const webhookPath = Deno.env.get("WEBHOOK_PATH") ?? "/";
if (!webhookPath.startsWith("/")) {
  console.error("error: WEBHOOK_PATH must start with a slash");
  Deno.exit(1);
}

await setupLogger();

serve(async (req) => {
  const url = new URL(req.url);
  if (req.method === "POST" && url.pathname === webhookPath) {
    try {
      return await handleUpdate(req);
    } catch (err) {
      log.error(err);
    }
  }
  return new Response();
}, { port });
