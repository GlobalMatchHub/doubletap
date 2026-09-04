# Doubletap conformance census

Generated 2026-09-04T01:15:31.569Z with seed `dt-census-1` on v22.23.2 / darwin-x64.

**1 of 85 servers that could actually be exercised have at least one tool that misbehaves under retry or interruption**, covering 1 of 313 exercised tools. Of those findings, 0 are a retry pushing the same write back out to somebody's API, 0 are a local side effect happening more than once, and 0 are an answer a retrying client cannot match to its first attempt. A further 9 servers started and listed tools but every call failed, almost always for want of credentials or a live external service; they are listed separately and excluded from these totals rather than counted as clean.

| Server | Monthly installs | Tools | Exercised | Contract violations | Upstream write repeated | Local effect twice | Answer not reproducible | Clean |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| nexus-agents | 36,481 | 47 | 5 | 1 | 0 | 0 | 0 | 2 |
| @aashari/mcp-server-atlassian-bitbucket | 16,705 | 6 | 5 | 0 | 0 | 0 | 0 | 4 |
| @aashari/mcp-server-atlassian-confluence | 26,963 | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| @aashari/mcp-server-atlassian-jira | 58,405 | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| @aikidosec/mcp | 99,553 | 4 | 2 | 0 | 0 | 0 | 0 | 1 |
| @antv/mcp-server-chart | 27,429 | 27 | 6 | 0 | 0 | 0 | 0 | 0 |
| @arizeai/phoenix-mcp | 13,147 | 27 | 2 | 0 | 0 | 0 | 0 | 1 |
| @atlassian-dc-mcp/jira | 15,410 | 14 | 6 | 0 | 0 | 0 | 0 | 1 |
| @avallon-labs/mcp | 18,230 | 153 | 2 | 0 | 0 | 0 | 0 | 1 |
| @bitbonsai/mcpvault | 67,569 | 18 | 6 | 0 | 0 | 0 | 0 | 1 |
| @brightdata/mcp | 29,455 | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| @browserbasehq/mcp | 19,830 | 6 | 1 | 0 | 0 | 0 | 0 | 0 |
| @coinbase/cds-mcp-server | 18,583 | 2 | 1 | 0 | 0 | 0 | 0 | 1 |
| @currents/mcp | 154,345 | 39 | 6 | 0 | 0 | 0 | 0 | 6 |
| @delorenj/mcp-server-ticketmaster | 15,836 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| @delorenj/mcp-server-trello | 13,618 | 57 | 4 | 0 | 0 | 0 | 0 | 4 |
| @doist/todoist-mcp | 15,850 | 45 | 1 | 0 | 0 | 0 | 0 | 1 |
| @drawio/mcp | 45,206 | 7 | 1 | 0 | 0 | 0 | 0 | 0 |
| @ehrocks/fe-mcp-server | 26,318 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| @esaio/esa-mcp-server | 22,479 | 22 | 6 | 0 | 0 | 0 | 0 | 0 |
| @felores/airtable-mcp-server | 50,799 | 12 | 6 | 0 | 0 | 0 | 0 | 4 |
| @google-cloud/observability-mcp | 110,871 | 13 | 6 | 0 | 0 | 0 | 0 | 0 |
| @google-cloud/storage-mcp | 51,287 | 15 | 6 | 0 | 0 | 0 | 0 | 2 |
| @growthbook/mcp | 34,475 | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| @hubspot/mcp-server | 73,968 | 21 | 3 | 0 | 0 | 0 | 0 | 2 |
| @instantdb/mcp | 30,494 | 7 | 1 | 0 | 0 | 0 | 0 | 0 |
| @isaacphi/mcp-gdrive | 31,291 | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| @jpisnice/shadcn-ui-mcp-server | 16,555 | 10 | 3 | 0 | 0 | 0 | 0 | 0 |
| @kolbo/mcp | 19,854 | 170 | 5 | 0 | 0 | 0 | 0 | 4 |
| @masonator/coolify-mcp | 23,798 | 44 | 6 | 0 | 0 | 0 | 0 | 1 |
| @mastergo/magic-mcp | 28,240 | 12 | 2 | 0 | 0 | 0 | 0 | 1 |
| @mastra/mcp-docs-server | 113,604 | 13 | 6 | 0 | 0 | 0 | 0 | 0 |
| @microsoft/clarity-mcp-server | 29,647 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| @modelcontextprotocol/server-everything | 800,463 | 14 | 6 | 0 | 0 | 0 | 0 | 0 |
| @modelcontextprotocol/server-filesystem | 2,334,928 | 14 | 6 | 0 | 0 | 0 | 0 | 2 |
| @modelcontextprotocol/server-memory | 364,588 | 9 | 5 | 0 | 0 | 0 | 0 | 2 |
| @modelcontextprotocol/server-pdf | 553,889 | 9 | 2 | 0 | 0 | 0 | 0 | 0 |
| @modelcontextprotocol/server-sequential-thinking | 484,365 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| @mui/mcp | 33,120 | 2 | 1 | 0 | 0 | 0 | 0 | 0 |
| @nextscope/mcp | 15,547 | 9 | 1 | 0 | 0 | 0 | 0 | 1 |
| @notionhq/notion-mcp-server | 712,988 | 24 | 6 | 0 | 0 | 0 | 0 | 3 |
| @perplexity-ai/mcp-server | 157,692 | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| @pinecone-database/mcp | 29,023 | 9 | 5 | 0 | 0 | 0 | 0 | 0 |
| @primer/mcp | 37,582 | 20 | 6 | 0 | 0 | 0 | 0 | 0 |
| @productbrain/mcp | 43,231 | 13 | 2 | 0 | 0 | 0 | 0 | 1 |
| @rebasepro/mcp | 14,244 | 40 | 3 | 0 | 0 | 0 | 0 | 0 |
| @roychri/mcp-server-asana | 13,201 | 41 | 6 | 0 | 0 | 0 | 0 | 0 |
| @runpod/mcp-server | 20,136 | 54 | 5 | 0 | 0 | 0 | 0 | 3 |
| @sellable/mcp | 44,522 | 198 | 1 | 0 | 0 | 0 | 0 | 0 |
| @serdnaley/metabase-mcp | 243,342 | 128 | 6 | 0 | 0 | 0 | 0 | 6 |
| @shopify/dev-mcp | 128,473 | 6 | 6 | 0 | 0 | 0 | 0 | 6 |
| @shortcut/mcp | 65,231 | 56 | 6 | 0 | 0 | 0 | 0 | 2 |
| @siemens/ix-mcp-react | 16,398 | 2 | 2 | 0 | 0 | 0 | 0 | 2 |
| @skanda-yutori/mcp-send-email | 14,368 | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| @thirdstrandstudio/mcp-figma | 27,873 | 31 | 6 | 0 | 0 | 0 | 0 | 3 |
| @tiberriver256/mcp-server-azure-devops | 15,269 | 46 | 6 | 0 | 0 | 0 | 0 | 0 |
| @transcend-io/mcp-server-docs | 65,903 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| @ui5/mcp-server | 419,971 | 10 | 4 | 0 | 0 | 0 | 0 | 0 |
| @upstash/context7-mcp | 3,992,771 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| @variflight-ai/variflight-mcp | 15,636 | 9 | 2 | 0 | 0 | 0 | 0 | 1 |
| @vizejs/musea-mcp-server | 13,031 | 13 | 1 | 0 | 0 | 0 | 0 | 0 |
| @xeroapi/xero-mcp-server | 21,821 | 51 | 6 | 0 | 0 | 0 | 0 | 0 |
| agentphone-mcp | 16,173 | 28 | 5 | 0 | 0 | 0 | 0 | 3 |
| airtable-mcp-server | 19,865 | 16 | 1 | 0 | 0 | 0 | 0 | 0 |
| alibabacloud-devops-mcp-server | 13,656 | 199 | 2 | 0 | 0 | 0 | 0 | 1 |
| bitbucket-mcp | 19,646 | 47 | 6 | 0 | 0 | 0 | 0 | 6 |
| brilliant-directories-mcp | 26,452 | 171 | 5 | 0 | 0 | 0 | 0 | 5 |
| comfyui-mcp | 519,525 | 41 | 2 | 0 | 0 | 0 | 0 | 0 |
| context-mode | 78,501 | 11 | 1 | 0 | 0 | 0 | 0 | 0 |
| document-mcp | 35,054 | 18 | 1 | 0 | 0 | 0 | 0 | 0 |
| fetcher-mcp | 38,939 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| flightradar-mcp-server | 16,092 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| freee-mcp | 204,960 | 15 | 6 | 0 | 0 | 0 | 0 | 0 |
| hostinger-api-mcp | 526,419 | 375 | 6 | 0 | 0 | 0 | 0 | 6 |
| howtocook-mcp | 20,318 | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| hyperbrowser-mcp | 13,699 | 10 | 2 | 0 | 0 | 0 | 0 | 2 |
| malicious-mcp-server | 13,851 | 7 | 5 | 0 | 0 | 0 | 0 | 0 |
| mcp-echo-server | 24,467 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| mcp-gsheets | 15,080 | 44 | 6 | 0 | 0 | 0 | 0 | 0 |
| mcp-hello-world | 143,921 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| mcp-scraper | 17,978 | 375 | 1 | 0 | 0 | 0 | 0 | 0 |
| n8n-mcp | 580,659 | 28 | 6 | 0 | 0 | 0 | 0 | 1 |
| next-devtools-mcp | 354,391 | 4 | 3 | 0 | 0 | 0 | 0 | 1 |
| samarth-gtm-mcp | 20,093 | 184 | 4 | 0 | 0 | 0 | 0 | 4 |
| serper-search-scrape-mcp-server | 27,293 | 2 | 2 | 0 | 0 | 0 | 0 | 2 |

## Started but not exercisable

These servers speak the protocol and list tools, but no call succeeded, so nothing about their retry behaviour is known.

`@azure-devops/mcp` (40), `@taazkareem/clickup-mcp-server` (150), `@ironbee-ai/devtools` (62), `igniteui-theming` (14), `@foldkit/devtools-mcp` (15), `@amap/amap-maps-mcp-server` (12), `@letoribo/mcp-graphql-enhanced` (2), `ask-experts-mcp` (3), `@tacticlaunch/mcp-linear` (198)

## @modelcontextprotocol/server-filesystem

`npm:@modelcontextprotocol/server-filesystem` &middot; secure-filesystem-server 0.2.0

No retry failures or contract violations among the tools this oracle could decide.

## @modelcontextprotocol/server-memory

`npm:@modelcontextprotocol/server-memory` &middot; memory-server 0.6.3

No retry failures or contract violations among the tools this oracle could decide.

## @modelcontextprotocol/server-everything

`npm:@modelcontextprotocol/server-everything` &middot; mcp-servers/everything 2.0.0

No retry failures or contract violations among the tools this oracle could decide.

## @upstash/context7-mcp

`npm:@upstash/context7-mcp@4.0.4` &middot; Context7 4.0.4

No retry failures or contract violations among the tools this oracle could decide.

## @notionhq/notion-mcp-server

`npm:@notionhq/notion-mcp-server@2.5.1` &middot; Notion API 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## n8n-mcp

`npm:n8n-mcp@2.79.1` &middot; n8n-documentation-mcp 2.79.1

No retry failures or contract violations among the tools this oracle could decide.

## @modelcontextprotocol/server-pdf

`npm:@modelcontextprotocol/server-pdf@1.7.5` &middot; PDF Server 2.0.0

No retry failures or contract violations among the tools this oracle could decide.

## hostinger-api-mcp

`npm:hostinger-api-mcp@1.55.0` &middot; hostinger-api-mcp 1.55.0

No retry failures or contract violations among the tools this oracle could decide.

## comfyui-mcp

`npm:comfyui-mcp@0.52.180` &middot; comfyui-mcp 0.52.180

No retry failures or contract violations among the tools this oracle could decide.

## @modelcontextprotocol/server-sequential-thinking

`npm:@modelcontextprotocol/server-sequential-thinking@2026.8.31` &middot; sequential-thinking-server 2026.8.31

No retry failures or contract violations among the tools this oracle could decide.

## @ui5/mcp-server

`npm:@ui5/mcp-server@0.2.18` &middot; UI5 0.2.18

No retry failures or contract violations among the tools this oracle could decide.

## next-devtools-mcp

`npm:next-devtools-mcp@0.4.0` &middot; next-devtools-mcp 0.4.0

No retry failures or contract violations among the tools this oracle could decide.

## @serdnaley/metabase-mcp

`npm:@serdnaley/metabase-mcp@0.2.0` &middot; metabase-mcp 0.1.0

No retry failures or contract violations among the tools this oracle could decide.

## freee-mcp

`npm:freee-mcp@0.34.2` &middot; freee 0.34.2

No retry failures or contract violations among the tools this oracle could decide.

## @perplexity-ai/mcp-server

`npm:@perplexity-ai/mcp-server@1.2.1` &middot; ai.perplexity/mcp-server 1.2.1

No retry failures or contract violations among the tools this oracle could decide.

## @currents/mcp

`npm:@currents/mcp@2.4.2` &middot; currents 2.4.2

No retry failures or contract violations among the tools this oracle could decide.

## mcp-hello-world

`npm:mcp-hello-world@1.1.2` &middot; hello-world 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## @shopify/dev-mcp

`npm:@shopify/dev-mcp@1.15.0` &middot; shopify-dev-mcp 1.15.0

No retry failures or contract violations among the tools this oracle could decide.

## @mastra/mcp-docs-server

`npm:@mastra/mcp-docs-server@1.2.23` &middot; Mastra Documentation Server 1.2.23

No retry failures or contract violations among the tools this oracle could decide.

## @google-cloud/observability-mcp

`npm:@google-cloud/observability-mcp@0.2.3` &middot; observability-mcp 0.2.3

No retry failures or contract violations among the tools this oracle could decide.

## @aikidosec/mcp

`npm:@aikidosec/mcp@1.0.21` &middot; Aikido MCP Server 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## context-mode

`npm:context-mode@1.0.169` &middot; context-mode 1.0.169

No retry failures or contract violations among the tools this oracle could decide.

## @hubspot/mcp-server

`npm:@hubspot/mcp-server@0.4.0` &middot; hubspot-mcp-server 0.4.0

No retry failures or contract violations among the tools this oracle could decide.

## @bitbonsai/mcpvault

`npm:@bitbonsai/mcpvault@0.16.0` &middot; mcpvault 0.16.0

No retry failures or contract violations among the tools this oracle could decide.

## @transcend-io/mcp-server-docs

`npm:@transcend-io/mcp-server-docs@0.4.0` &middot; transcend-mcp-docs 0.4.0

No retry failures or contract violations among the tools this oracle could decide.

## @shortcut/mcp

`npm:@shortcut/mcp@0.25.0` &middot; @shortcut/mcp 0.25.0

No retry failures or contract violations among the tools this oracle could decide.

## @aashari/mcp-server-atlassian-jira

`npm:@aashari/mcp-server-atlassian-jira@3.3.0` &middot; @aashari/mcp-server-atlassian-jira 3.3.0

No retry failures or contract violations among the tools this oracle could decide.

## @google-cloud/storage-mcp

`npm:@google-cloud/storage-mcp@0.6.0` &middot; storage-mcp-server 0.6.0

No retry failures or contract violations among the tools this oracle could decide.

## @felores/airtable-mcp-server

`npm:@felores/airtable-mcp-server@0.3.0` &middot; airtable-server 0.2.0

No retry failures or contract violations among the tools this oracle could decide.

## @drawio/mcp

`npm:@drawio/mcp@1.5.0` &middot; drawio-mcp 1.5.0

No retry failures or contract violations among the tools this oracle could decide.

## @sellable/mcp

`npm:@sellable/mcp@0.1.920` &middot; sellable-mcp 0.1.920

No retry failures or contract violations among the tools this oracle could decide.

## @productbrain/mcp

`npm:@productbrain/mcp@0.0.1-beta.5290` &middot; Product Brain 0.7.2

No retry failures or contract violations among the tools this oracle could decide.

## fetcher-mcp

`npm:fetcher-mcp@0.3.9` &middot; browser-mcp 0.1.0

No retry failures or contract violations among the tools this oracle could decide.

## @primer/mcp

`npm:@primer/mcp@1.0.0` &middot; Primer 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## nexus-agents

`npm:nexus-agents@7.0.0` &middot; nexus-agents 7.0.0

- **delegate_to_model** (concurrency) Run one at a time, 4 calls left 14 entries behind; run at once they left 13, so 1 of them were overwritten by a call that had already read the state.
  - reproduce: `doubletap replay runs/census-conc/nexus-agents-dt-census-1.dt.jsonl --probe concurrency --tool delegate_to_model`

## document-mcp

`npm:document-mcp@4.2.2` &middot; document-mcp 4.2.2

No retry failures or contract violations among the tools this oracle could decide.

## @growthbook/mcp

`npm:@growthbook/mcp@2.1.0` &middot; GrowthBook MCP Thin 2.1.0

No retry failures or contract violations among the tools this oracle could decide.

## @mui/mcp

`npm:@mui/mcp@0.1.4` &middot; mui-mcp 0.1.4

No retry failures or contract violations among the tools this oracle could decide.

## @isaacphi/mcp-gdrive

`npm:@isaacphi/mcp-gdrive@0.2.0` &middot; example-servers/gdrive 0.1.0

No retry failures or contract violations among the tools this oracle could decide.

## @instantdb/mcp

`npm:@instantdb/mcp@1.0.67` &middot; @instantdb/mcp v1.0.67

No retry failures or contract violations among the tools this oracle could decide.

## @microsoft/clarity-mcp-server

`npm:@microsoft/clarity-mcp-server@2.0.1` &middot; @microsoft/clarity-mcp-server 2.0.1

No retry failures or contract violations among the tools this oracle could decide.

## @brightdata/mcp

`npm:@brightdata/mcp@2.11.1` &middot; Bright Data 2.11.1

No retry failures or contract violations among the tools this oracle could decide.

## @pinecone-database/mcp

`npm:@pinecone-database/mcp@0.3.0` &middot; pinecone-mcp 0.3.0

No retry failures or contract violations among the tools this oracle could decide.

## @mastergo/magic-mcp

`npm:@mastergo/magic-mcp@0.2.9` &middot; MasterGoMcpServer 0.2.9

No retry failures or contract violations among the tools this oracle could decide.

## @thirdstrandstudio/mcp-figma

`npm:@thirdstrandstudio/mcp-figma@0.7.0` &middot; mcp_figma 0.6.2

No retry failures or contract violations among the tools this oracle could decide.

## @antv/mcp-server-chart

`npm:@antv/mcp-server-chart@0.9.10` &middot; mcp-server-chart 0.8.x

No retry failures or contract violations among the tools this oracle could decide.

## serper-search-scrape-mcp-server

`npm:serper-search-scrape-mcp-server@0.1.2` &middot; Serper MCP Server 0.1.0

No retry failures or contract violations among the tools this oracle could decide.

## @aashari/mcp-server-atlassian-confluence

`npm:@aashari/mcp-server-atlassian-confluence@3.3.0` &middot; @aashari/mcp-server-atlassian-confluence 3.3.0

No retry failures or contract violations among the tools this oracle could decide.

## brilliant-directories-mcp

`npm:brilliant-directories-mcp@6.58.608` &middot; brilliant-directories-mcp 6.58.608

No retry failures or contract violations among the tools this oracle could decide.

## @ehrocks/fe-mcp-server

`npm:@ehrocks/fe-mcp-server@1.0.10` &middot; hero-design-mcp-server 1.0.10

No retry failures or contract violations among the tools this oracle could decide.

## mcp-echo-server

`npm:mcp-echo-server@1.0.0` &middot; mcp-echo-server 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## @masonator/coolify-mcp

`npm:@masonator/coolify-mcp@2.19.4` &middot; coolify 2.19.4

No retry failures or contract violations among the tools this oracle could decide.

## @esaio/esa-mcp-server

`npm:@esaio/esa-mcp-server@0.1.0` &middot; esa-mcp-server 0.1.0

No retry failures or contract violations among the tools this oracle could decide.

## @xeroapi/xero-mcp-server

`npm:@xeroapi/xero-mcp-server@0.0.17` &middot; Xero MCP Server 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## howtocook-mcp

`npm:howtocook-mcp@0.2.2` &middot; howtocook-mcp 0.2.2

No retry failures or contract violations among the tools this oracle could decide.

## @runpod/mcp-server

`npm:@runpod/mcp-server@3.3.0` &middot; Runpod API Server 3.3.0 [RUNPOD_REST_VERSION unset (default v2)]

No retry failures or contract violations among the tools this oracle could decide.

## samarth-gtm-mcp

`npm:samarth-gtm-mcp@1.483.0` &middot; samarth-gtm-mcp 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## airtable-mcp-server

`npm:airtable-mcp-server@1.14.0` &middot; airtable-mcp-server 1.14.0

No retry failures or contract violations among the tools this oracle could decide.

## @kolbo/mcp

`npm:@kolbo/mcp@1.86.0` &middot; kolbo 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## @browserbasehq/mcp

`npm:@browserbasehq/mcp@3.0.0` &middot; Browserbase MCP Server 3.0.0

No retry failures or contract violations among the tools this oracle could decide.

## bitbucket-mcp

`npm:bitbucket-mcp@5.0.6` &middot; bitbucket-mcp-server 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## @coinbase/cds-mcp-server

`npm:@coinbase/cds-mcp-server@9.25.0` &middot; cds 9.25.0

No retry failures or contract violations among the tools this oracle could decide.

## @avallon-labs/mcp

`npm:@avallon-labs/mcp@43.1.0` &middot; avallonAPIServer 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## mcp-scraper

`npm:mcp-scraper@0.88.2` &middot; mcp-scraper 0.88.2

No retry failures or contract violations among the tools this oracle could decide.

## @aashari/mcp-server-atlassian-bitbucket

`npm:@aashari/mcp-server-atlassian-bitbucket@3.1.0` &middot; @aashari/mcp-server-atlassian-bitbucket 3.1.0

No retry failures or contract violations among the tools this oracle could decide.

## @jpisnice/shadcn-ui-mcp-server

`npm:@jpisnice/shadcn-ui-mcp-server@2.0.0` &middot; shadcn-ui-mcp-server 2.0.0

No retry failures or contract violations among the tools this oracle could decide.

## @siemens/ix-mcp-react

`npm:@siemens/ix-mcp-react@5.2.1-v.1.11.3` &middot; @siemens/ix-mcp-react 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## agentphone-mcp

`npm:agentphone-mcp@0.7.0` &middot; agentphone 0.7.0

No retry failures or contract violations among the tools this oracle could decide.

## flightradar-mcp-server

`npm:flightradar-mcp-server@0.1.2` &middot; flightradar-mcp-server 0.1.0

No retry failures or contract violations among the tools this oracle could decide.

## @doist/todoist-mcp

`npm:@doist/todoist-mcp@11.0.0` &middot; todoist-mcp-server 11.0.0

No retry failures or contract violations among the tools this oracle could decide.

## @delorenj/mcp-server-ticketmaster

`npm:@delorenj/mcp-server-ticketmaster@0.2.5` &middot; ticketmaster 0.2.0

No retry failures or contract violations among the tools this oracle could decide.

## @variflight-ai/variflight-mcp

`npm:@variflight-ai/variflight-mcp@1.0.3` &middot; variflight-mcp 1.0.3

No retry failures or contract violations among the tools this oracle could decide.

## @nextscope/mcp

`npm:@nextscope/mcp@0.3.0` &middot; nextscope 0.1.0

No retry failures or contract violations among the tools this oracle could decide.

## @atlassian-dc-mcp/jira

`npm:@atlassian-dc-mcp/jira@0.34.0` &middot; atlassian-jira-mcp 0.34.0

No retry failures or contract violations among the tools this oracle could decide.

## @tiberriver256/mcp-server-azure-devops

`npm:@tiberriver256/mcp-server-azure-devops@0.1.46` &middot; azure-devops-mcp 0.1.0

No retry failures or contract violations among the tools this oracle could decide.

## mcp-gsheets

`npm:mcp-gsheets@1.10.2` &middot; spreadsheet 1.8.0

No retry failures or contract violations among the tools this oracle could decide.

## @skanda-yutori/mcp-send-email

`npm:@skanda-yutori/mcp-send-email@1.0.0` &middot; email-sending-service 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## @rebasepro/mcp

`npm:@rebasepro/mcp@0.17.3` &middot; rebase-mcp-server 0.17.3

No retry failures or contract violations among the tools this oracle could decide.

## malicious-mcp-server

`npm:malicious-mcp-server@1.5.0` &middot; e2e-purposes-malicious-server 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## hyperbrowser-mcp

`npm:hyperbrowser-mcp@1.0.25` &middot; hyperbrowser 1.0.24

No retry failures or contract violations among the tools this oracle could decide.

## alibabacloud-devops-mcp-server

`npm:alibabacloud-devops-mcp-server@0.3.61` &middot; alibabacloud-devops-mcp-server 0.3.61

No retry failures or contract violations among the tools this oracle could decide.

## @delorenj/mcp-server-trello

`npm:@delorenj/mcp-server-trello@1.8.1` &middot; trello-server 1.8.1

No retry failures or contract violations among the tools this oracle could decide.

## @roychri/mcp-server-asana

`npm:@roychri/mcp-server-asana@1.8.0` &middot; Asana MCP Server 1.8.0

No retry failures or contract violations among the tools this oracle could decide.

## @arizeai/phoenix-mcp

`npm:@arizeai/phoenix-mcp@4.3.7` &middot; phoenix-mcp-server 1.1.0

No retry failures or contract violations among the tools this oracle could decide.

## @vizejs/musea-mcp-server

`npm:@vizejs/musea-mcp-server@0.390.0` &middot; musea-mcp-server 0.0.1-alpha.11

No retry failures or contract violations among the tools this oracle could decide.
