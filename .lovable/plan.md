## Problema

O site publicado (`ford-compare-buddy.lovable.app`) está com visibilidade **pública** — qualquer pessoa com o link consegue abrir. Logo, o "não funcionou" não é tela de login: é a chamada à API que falha em produção.

A API que estamos usando é `http://163.176.204.45:8080/api/v1` — um IP privado/interno com Basic Auth (`admin.ti` / `admin123`). No preview do Lovable o servidor às vezes consegue rotear, mas no domínio publicado (Cloudflare Worker) esse IP provavelmente **não é acessível pela internet pública**, então o `fetch` server-side retorna erro de rede / timeout.

## Plano de diagnóstico (passo 1)

1. Chamar a server function `compareCars` em produção via `invoke-server-function` com `versaoFord = "ranger raptor"` e `concorrente = "ferrari sf90"`.
2. Ler `server-function-logs` (deployment = published) para confirmar a causa exata:
   - `fetch failed` / `ECONNREFUSED` / `ETIMEDOUT` → IP não roteável da internet (causa mais provável).
   - `401 Unauthorized` → secrets `FORD_API_USER` / `FORD_API_PASS` não configurados em produção.
   - Outro erro → tratar conforme o stack.

## Plano de correção (passo 2, depende do diagnóstico)

### Cenário A — IP interno não acessível (mais provável)
A API `163.176.204.45:8080` precisa estar exposta na internet pública para o site publicado funcionar. Opções, em ordem de recomendação:

1. **Expor a API publicamente** com um domínio + HTTPS (ex.: `api.seudominio.com`) e atualizar `FORD_API_BASE` nos secrets. É a solução correta para produção.
2. **Túnel temporário** (Cloudflare Tunnel / ngrok) apontando para `163.176.204.45:8080`, e usar a URL pública gerada como `FORD_API_BASE`. Bom para demo, não para produção.
3. **Rodar a API na mesma rede do Lovable Cloud** (migrar o backend Java pra cá).

Em qualquer caso eu:
- Garanto que a base URL fica em secret (`FORD_API_BASE`), não hardcoded.
- Confirmo que `FORD_API_USER` e `FORD_API_PASS` estão setados no ambiente de produção.

### Cenário B — Secrets faltando em produção
Adicionar `FORD_API_USER`, `FORD_API_PASS` (e `FORD_API_BASE` se for o caso) via secrets e republicar.

### Cenário C — Outro erro
Aplicar fix dirigido pelo log e adicionar tratamento de erro amigável na UI ("API indisponível" em vez de tela travada).

## Melhorias de UX (independente do cenário)

- Exibir mensagem clara quando a chamada falha (status + dica), em vez de só "Analisando…" infinito.
- Botão "tentar novamente" no card de erro.

## Pergunta pra você

A API `163.176.204.45:8080` é acessível pela internet pública, ou só dentro de uma rede interna/VPN? Se for interna, qual caminho prefere: expor com domínio próprio, usar um túnel (Cloudflare/ngrok) ou migrar a API pra Lovable Cloud?