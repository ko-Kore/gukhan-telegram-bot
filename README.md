<!-- deno-fmt-ignore-file -->

🤖 國漢大百科봇
===============

![](preview.png)

**國漢大百科봇**\([@GukhanBot])은 《[國漢大百科]》의 情報와 機能을
텔레그램에서도 一部 누릴 수 있도록 돕는 텔레그램 봇입니다.

利用하시려면 [@GukhanBot]에게 말을 걸거나, 對話 그룹에 [@GukhanBot]을
데려오시면 됩니다. 仔細한 使用法은 `/help` 커맨드를 通해 볼 수 있습니다.

[@GukhanBot]: https://t.me/GukhanBot
[國漢大百科]: https://wiki.xn--9cs231j0ji.xn--p8s937b.net/


開發 및 改善
------------

이 소프트웨어는 [디노][](Deno) 플랫폼을 必要로 합니다.  디노가 깔려있지 않으면
먼저 設置한 뒤, 아래 커맨드로 實行해 볼 수 있습니다.

~~~~ bash
TELEGRAM_BOT_TOKEN=... deno task run
~~~~

[디노]: https://deno.land/


### 環境 變數

몇 가지 必須 設定 및 옵션을 環境 變數로 받습니다.

 -  `TELEGRAM_BOT_TOKEN` (必須): 開發 및 테스트 用度의 봇 어카운트를 만들어서
    그 봇 어카운트의 토큰을 넣어야 합니다.
 -  `SEONBI_API_BIN` (옵션): [선비] HTTP API 서버의 實行 파일(`seonbi-api`)
    位置를 받습니다.  비워두면 알아서 公式 릴리스를 받아서 實行합니다.
 -  `DEBUG` (옵션): 디버깅 로그의 出力 與否.  基本的으론 出力하지 않습니다. 
    (`DEBUG=true`로 켭니다.)

[선비]: https://github.com/dahlia/seonbi


### 봇 어카운트 設定 

`TELEGRAM_BOT_TOKEN`에 넣을 봇 어카운트 토큰을 求하려면 먼저 [@BotFather]의
`/netbot` 커맨드를 通해 봇 어카운트를 生成해야 합니다.

또, 그 봇을 다른 그룹에 追加해서 쓰려면 `/setjoingroups` 커맨드로 그룹 參加를
許容해야 하고, 그룹 안에서 `[[위키 文法]]`을 쓰기 爲해서 `/setprivacy`
커맨드로 봇의 프라이버시 모드도 꺼야 합니다.

[@BotFather]: https://t.me/BotFather


라이선스
--------

이 봇은 [AGPL (GNU 아페로 一般 公眾 許可書) 3.0][AGPLv3]으로 配布되는 自由·오픈
소스 소프트웨어입니다.

[AGPLv3]: https://www.gnu.org/licenses/agpl-3.0.html
