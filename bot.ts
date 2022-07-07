import {
  Bot,
  BotError,
  Context,
} from "https://deno.land/x/grammy@v1.9.0/mod.ts";
import { Seonbi } from "https://deno.land/x/seonbi@0.3.1/mod.ts";

const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
if (token == null) {
  console.error("Missing env var: TELEGRAM_BOT_TOKEN");
  Deno.exit(1);
}

let seonbiBinPath: string | undefined;
if (
  (await Deno.permissions.query({ name: "env", variable: "SEONBI_API_BIN" }))
    .state == "granted"
) {
  seonbiBinPath = Deno.env.get("SEONBI_API_BIN");
}

const bot = new Bot(token);

const seonbi = new Seonbi({
  port: 3800,
  process: seonbiBinPath != null ? { binPath: seonbiBinPath } : "download",
});

const wikiApiUrl = new URL(
  "https://wiki.xn--9cs231j0ji.xn--p8s937b.net/api.php",
);
const githubUrl = "https://github.com/ko-Kore/gukhan-telegram-bot";
const agplv3Url = "https://www.gnu.org/licenses/agpl-3.0.html";

const helpMessage = `\
*國漢大百科봇*은 《[國漢大百科](https://wiki.xn--9cs231j0ji.xn--p8s937b.net/)》\
의 情報와 機能을 텔레그램에서도 一部 누릴 수 있도록 돕는 텔레그램 봇입니다\\.  \
다음과 같은 커맨드에 反應합니다\\.

*/help*: 이 도움말을 보여줍니다\\.
*/start*: 同上
*/도움말*: 同上
*/?*: 同上

*/hangeul*: 文章 內 漢字를 한글로 보여줍니다\\.  읽기는 《標準國語大辭典》의 \
標題語를 따릅니다\\.  \\(例\\: 「毛澤東」은 「마오쩌둥」으로 變換\\.\\)
*/hangul*: 同上
*/h*: 同上
*/한글*: 同上
*/ㅎ*: 同上

이 봇은 [AGPL\\(GNU 아페로 一般 公眾 許可書\\) 3\\.0](${agplv3Url})으로 \
配布되는 自由·오픈 소스 소프트웨어이며, 소스 코드는 [깃허브](${githubUrl})에서 \
求할 수 있습니다\\.
`;

async function help(ctx: Context): Promise<void> {
  await ctx.reply(helpMessage, {
    reply_to_message_id: ctx.msg?.message_id,
    disable_notification: true,
    parse_mode: "MarkdownV2",
  });
}

async function hanjaToHangul(ctx: Context): Promise<void> {
  const msg = (ctx.msg?.text ?? "");
  const text = msg.replace(/^\/\S+\s*/, "");
  if (text == "") {
    const cmd = (msg.trim() == "" ? "/hangeul" : msg.trim());
    await ctx.reply(`커맨드 뒤에 글을 入力해주세요. (例: ${cmd} 安寧하세요.)`);
    return;
  }
  const hangul = await seonbi.transform(text, {
    contentType: "text/plain",
    quote: "CurvedQuotes",
    cite: "AngleQuotes",
    arrow: { bidirArrow: true, doubleArrow: true },
    ellipsis: true,
    emDash: true,
    stop: "Horizontal",
    hanja: {
      rendering: "HangulOnly",
      reading: {
        initialSoundLaw: true,
        useDictionaries: ["kr-stdict"],
        dictionary: {},
      },
    },
  });
  await ctx.reply(hangul, {
    reply_to_message_id: ctx.msg?.message_id,
    disable_notification: true,
  });
}

const wikiLinkPattern = /\[\[(.+?)\]\]/g;

async function wikiLink(ctx: Context): Promise<void> {
  const msg = ctx.message?.text ?? "";
  const titles: string[] = [];
  for (const [_, title] of msg.matchAll(wikiLinkPattern)) {
    titles.push(title);
  }
  const encodedTitles = titles.map(encodeURIComponent).join("|");
  const infoApiUrl = new URL(
    "?format=json&action=query&prop=info&inprop=url|displaytitle&titles=" +
      encodedTitles,
    wikiApiUrl,
  );
  const extractApiUrl = new URL(
    "?format=json&action=query&prop=extracts&exintro=true&explaintext=true" +
      "&exsentences=1&redirects&titles=" + encodedTitles,
    wikiApiUrl,
  );
  const [infoResponse, extractResponse] = await Promise.all([
    fetch(infoApiUrl),
    fetch(extractApiUrl),
  ]);
  const infoResult: {
    query: {
      pages: Record<
        string,
        {
          displaytitle: string;
          title: string;
          canonicalurl: string;
          missing?: "";
        }
      >;
    };
  } = await infoResponse.json();
  const extractResult: {
    query: {
      redirects?: [{ from: string; to: string }];
      pages: Record<string, { title: string; extract: string }>;
    };
  } = await extractResponse.json();
  const redirects = Object.fromEntries(
    (extractResult.query?.redirects ?? [])
      .map((pair) => [pair.to, pair.from]),
  );
  const extracts = Object.fromEntries(
    Object.values(extractResult.query.pages).map((p) => [
      redirects[p.title] ?? p.title,
      p.extract,
    ]),
  );
  const pages = Object.values(infoResult.query.pages);
  pages.sort((a, b) => {
    let aPos = titles.indexOf(a.title);
    aPos = aPos < 0 ? titles.indexOf(a.displaytitle) : aPos;
    aPos = aPos < 0 ? titles.length : aPos;
    let bPos = titles.indexOf(b.title);
    bPos = bPos < 0 ? titles.indexOf(b.displaytitle) : bPos;
    bPos = bPos < 0 ? titles.length : bPos;
    return aPos - bPos;
  });
  let replyHtml = "";
  for (const page of pages) {
    const tag = page.missing == null ? "b" : "s";
    replyHtml += `[[<a href="${escapeHtml(page.canonicalurl)}"><${tag}>${
      escapeHtml(page.displaytitle)
    }</${tag}></a>]]`;
    if (page.missing != null) {
      replyHtml += " <s>(아직 없는 文書)</s>";
    } else if (
      extracts[page.title] != null ||
      extracts[page.displaytitle] != null
    ) {
      const extract = extracts[page.title] ?? extracts[page.displaytitle];
      if (extract.trim() !== "") replyHtml += `: ${escapeHtml(extract)}`;
    }
    replyHtml += "\n";
  }
  await ctx.reply(replyHtml, {
    reply_to_message_id: ctx.msg?.message_id,
    disable_notification: true,
    disable_web_page_preview: true,
    parse_mode: "HTML",
  });
}

bot.command("start", help);
bot.command("help", help);
bot.command("?", help);

bot.command("hangeul", hanjaToHangul);
bot.command("hangul", hanjaToHangul);
bot.command("h", hanjaToHangul);

bot.on("message", async (ctx: Context) => {
  if (ctx.message?.text?.match(/^\/(한글|ㅎ)/)) {
    return await hanjaToHangul(ctx);
  } else if (ctx.message?.text?.startsWith("/도움말")) {
    return await hanjaToHangul(ctx);
  } else if (ctx.message?.text?.match(wikiLinkPattern)) {
    return await wikiLink(ctx);
  }
});

bot.catch(async (error: BotError) => {
  console.error(error);
  const msg = "豫想치 못한 誤謬가 發生했습니다.\n\n<code>" + escapeHtml(error.toString()) +
    "</code>";
  try {
    await error.ctx.reply(
      msg,
      {
        reply_to_message_id: error.ctx.msg?.message_id,
        disable_notification: true,
        parse_mode: "HTML",
      },
    );
  } catch (e) {
    console.debug("Error message:", JSON.stringify(msg));
    throw e;
  }
});

function escapeHtml(text: string): string {
  return text.replaceAll(
    /["<>&]/g,
    (s) =>
      s == "&"
        ? "&amp;"
        : s == "<"
        ? "&lt;"
        : s == ">"
        ? "&gt;"
        : s == '"'
        ? "&quot;"
        : s,
  );
}

bot.start();
