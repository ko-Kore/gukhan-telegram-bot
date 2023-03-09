FROM ghcr.io/dahlia/seonbi/bin@sha256:ddbd33ecfec903d2b4bbdef558c9103a48121a885bcff13691c104c388b3f18e AS seonbi

FROM denoland/deno:1.31.1

WORKDIR /app

COPY --from=seonbi /usr/local/bin/seonbi-api /usr/local/bin/seonbi-api

ADD . .

RUN deno cache --lock=deno.lock bot.ts

ENV SEONBI_API_BIN=/usr/local/bin/seonbi-api

CMD ["run", "--allow-all", "--check", "--lock=deno.lock", "fly.ts"]
