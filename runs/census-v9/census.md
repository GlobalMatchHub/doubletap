# Doubletap conformance census

Generated 2026-09-04T14:16:08.912Z with seed `dt-census-1` on v22.23.2 / darwin-x64.

**44 of 90 servers that could actually be exercised have at least one tool that misbehaves under retry or interruption**, covering 161 of 581 exercised tools. Of those findings, 143 are a retry pushing the same write back out to somebody's API, 1 are a local side effect happening more than once, and 21 are an answer a retrying client cannot match to its first attempt. A further 0 servers started and listed tools but every call failed, almost always for want of credentials or a live external service; they are listed separately and excluded from these totals rather than counted as clean.

| Server | Monthly installs | Tools | Exercised | Contract violations | Upstream write repeated | Local effect twice | Answer not reproducible | Clean |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| nexus-agents | 36,481 | 47 | 7 | 1 | 1 | 1 | 0 | 11 |
| @shortcut/mcp | 65,231 | 56 | 8 | 0 | 3 | 0 | 7 | 12 |
| brilliant-directories-mcp | 26,452 | 171 | 8 | 0 | 8 | 0 | 0 | 14 |
| @google-cloud/observability-mcp | 110,871 | 13 | 8 | 0 | 0 | 0 | 8 | 8 |
| @serdnaley/metabase-mcp | 243,342 | 128 | 8 | 0 | 8 | 0 | 0 | 16 |
| @tacticlaunch/mcp-linear | 16,377 | 198 | 8 | 0 | 8 | 0 | 0 | 0 |
| @doist/todoist-mcp | 15,850 | 45 | 8 | 0 | 7 | 0 | 0 | 2 |
| bitbucket-mcp | 19,646 | 47 | 8 | 0 | 7 | 0 | 0 | 17 |
| @shopify/dev-mcp | 128,473 | 6 | 5 | 0 | 5 | 0 | 1 | 10 |
| hostinger-api-mcp | 526,419 | 375 | 8 | 0 | 6 | 0 | 0 | 18 |
| hyperbrowser-mcp | 13,699 | 10 | 8 | 0 | 6 | 0 | 0 | 7 |
| @browserbasehq/mcp | 19,830 | 6 | 6 | 0 | 5 | 0 | 0 | 1 |
| @nextscope/mcp | 15,547 | 9 | 6 | 0 | 5 | 0 | 0 | 2 |
| @runpod/mcp-server | 20,136 | 54 | 8 | 0 | 4 | 0 | 0 | 13 |
| alibabacloud-devops-mcp-server | 13,656 | 199 | 8 | 0 | 5 | 0 | 0 | 8 |
| mcp-scraper | 17,978 | 375 | 8 | 0 | 5 | 0 | 0 | 3 |
| @coinbase/cds-mcp-server | 18,583 | 2 | 2 | 0 | 2 | 0 | 0 | 2 |
| @currents/mcp | 154,345 | 39 | 8 | 0 | 4 | 0 | 0 | 20 |
| @delorenj/mcp-server-trello | 13,618 | 57 | 8 | 0 | 4 | 0 | 0 | 14 |
| @hubspot/mcp-server | 73,968 | 21 | 8 | 0 | 4 | 0 | 0 | 10 |
| @kolbo/mcp | 19,854 | 170 | 8 | 0 | 4 | 0 | 0 | 17 |
| airtable-mcp-server | 19,865 | 16 | 8 | 0 | 4 | 0 | 0 | 4 |
| samarth-gtm-mcp | 20,093 | 184 | 8 | 0 | 4 | 0 | 0 | 8 |
| @avallon-labs/mcp | 18,230 | 153 | 8 | 0 | 3 | 0 | 0 | 8 |
| @felores/airtable-mcp-server | 50,799 | 12 | 8 | 0 | 3 | 0 | 0 | 17 |
| @productbrain/mcp | 43,231 | 13 | 8 | 0 | 3 | 0 | 0 | 2 |
| ask-experts-mcp | 17,411 | 3 | 3 | 0 | 3 | 0 | 0 | 0 |
| @arizeai/phoenix-mcp | 13,147 | 27 | 8 | 0 | 2 | 0 | 0 | 6 |
| @atlassian-dc-mcp/jira | 15,410 | 14 | 8 | 0 | 2 | 0 | 0 | 15 |
| @google-cloud/storage-mcp | 51,287 | 15 | 8 | 0 | 2 | 0 | 0 | 14 |
| @masonator/coolify-mcp | 23,798 | 44 | 8 | 0 | 2 | 0 | 0 | 15 |
| @modelcontextprotocol/server-filesystem | 2,334,928 | 14 | 8 | 0 | 0 | 0 | 2 | 22 |
| @modelcontextprotocol/server-memory | 364,588 | 9 | 8 | 0 | 0 | 0 | 2 | 15 |
| @notionhq/notion-mcp-server | 712,988 | 24 | 8 | 0 | 2 | 0 | 0 | 22 |
| @siemens/ix-mcp-react | 16,398 | 2 | 2 | 0 | 2 | 0 | 0 | 4 |
| agentphone-mcp | 16,173 | 28 | 8 | 0 | 2 | 0 | 0 | 16 |
| serper-search-scrape-mcp-server | 27,293 | 2 | 2 | 0 | 2 | 0 | 0 | 4 |
| @bitbonsai/mcpvault | 67,569 | 18 | 8 | 0 | 0 | 0 | 1 | 10 |
| @growthbook/mcp | 34,475 | 4 | 4 | 0 | 1 | 0 | 0 | 7 |
| @letoribo/mcp-graphql-enhanced | 17,762 | 2 | 2 | 0 | 1 | 0 | 0 | 0 |
| @pinecone-database/mcp | 29,023 | 9 | 8 | 0 | 1 | 0 | 0 | 10 |
| @skanda-yutori/mcp-send-email | 14,368 | 1 | 1 | 0 | 1 | 0 | 0 | 2 |
| @variflight-ai/variflight-mcp | 15,636 | 9 | 8 | 0 | 1 | 0 | 0 | 3 |
| next-devtools-mcp | 354,391 | 4 | 4 | 0 | 1 | 0 | 0 | 4 |
| @amap/amap-maps-mcp-server | 18,534 | 12 | 8 | 0 | 0 | 0 | 0 | 8 |
| @antv/mcp-server-chart | 27,429 | 27 | 8 | 0 | 0 | 0 | 0 | 8 |
| @azure-devops/mcp | 389,884 | 40 | 6 | 0 | 0 | 0 | 0 | 0 |
| @brightdata/mcp | 29,455 | 5 | 5 | 0 | 0 | 0 | 0 | 13 |
| @delorenj/mcp-server-ticketmaster | 15,836 | 1 | 1 | 0 | 0 | 0 | 0 | 2 |
| @drawio/mcp | 45,206 | 7 | 7 | 0 | 0 | 0 | 0 | 2 |
| @ehrocks/fe-mcp-server | 26,318 | 1 | 1 | 0 | 0 | 0 | 0 | 3 |
| @esaio/esa-mcp-server | 22,479 | 22 | 8 | 0 | 0 | 0 | 0 | 9 |
| @foldkit/devtools-mcp | 21,516 | 15 | 8 | 0 | 0 | 0 | 0 | 0 |
| @instantdb/mcp | 30,494 | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| @ironbee-ai/devtools | 46,365 | 62 | 8 | 0 | 0 | 0 | 0 | 8 |
| @isaacphi/mcp-gdrive | 31,291 | 4 | 4 | 0 | 0 | 0 | 0 | 9 |
| @jpisnice/shadcn-ui-mcp-server | 16,555 | 10 | 8 | 0 | 0 | 0 | 0 | 11 |
| @mastergo/magic-mcp | 28,240 | 12 | 8 | 0 | 0 | 0 | 0 | 8 |
| @mastra/mcp-docs-server | 113,604 | 13 | 8 | 0 | 0 | 0 | 0 | 8 |
| @microsoft/clarity-mcp-server | 29,647 | 3 | 3 | 0 | 0 | 0 | 0 | 4 |
| @modelcontextprotocol/server-everything | 800,463 | 14 | 8 | 0 | 0 | 0 | 0 | 14 |
| @modelcontextprotocol/server-pdf | 553,889 | 9 | 8 | 0 | 0 | 0 | 0 | 3 |
| @modelcontextprotocol/server-sequential-thinking | 484,365 | 1 | 1 | 0 | 0 | 0 | 0 | 2 |
| @mui/mcp | 33,120 | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| @perplexity-ai/mcp-server | 157,692 | 4 | 4 | 0 | 0 | 0 | 0 | 4 |
| @primer/mcp | 37,582 | 20 | 8 | 0 | 0 | 0 | 0 | 15 |
| @rebasepro/mcp | 14,244 | 40 | 8 | 0 | 0 | 0 | 0 | 6 |
| @roychri/mcp-server-asana | 13,201 | 41 | 8 | 0 | 0 | 0 | 0 | 8 |
| @sellable/mcp | 44,522 | 198 | 8 | 0 | 0 | 0 | 0 | 1 |
| @taazkareem/clickup-mcp-server | 104,320 | 150 | 8 | 0 | 0 | 0 | 0 | 0 |
| @thirdstrandstudio/mcp-figma | 27,873 | 31 | 8 | 0 | 0 | 0 | 0 | 19 |
| @tiberriver256/mcp-server-azure-devops | 15,269 | 46 | 8 | 0 | 0 | 0 | 0 | 8 |
| @transcend-io/mcp-server-docs | 65,903 | 2 | 2 | 0 | 0 | 0 | 0 | 3 |
| @ui5/mcp-server | 419,971 | 10 | 6 | 0 | 0 | 0 | 0 | 5 |
| @upstash/context7-mcp | 3,992,771 | 2 | 2 | 0 | 0 | 0 | 0 | 6 |
| @vizejs/musea-mcp-server | 13,031 | 13 | 8 | 0 | 0 | 0 | 0 | 1 |
| @xeroapi/xero-mcp-server | 21,821 | 51 | 8 | 0 | 0 | 0 | 0 | 16 |
| comfyui-mcp | 519,525 | 41 | 8 | 0 | 0 | 0 | 0 | 5 |
| context-mode | 78,501 | 11 | 8 | 0 | 0 | 0 | 0 | 0 |
| document-mcp | 35,054 | 18 | 8 | 0 | 0 | 0 | 0 | 1 |
| fetcher-mcp | 38,939 | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| flightradar-mcp-server | 16,092 | 3 | 3 | 0 | 0 | 0 | 0 | 2 |
| freee-mcp | 204,960 | 15 | 8 | 0 | 0 | 0 | 0 | 11 |
| howtocook-mcp | 20,318 | 5 | 5 | 0 | 0 | 0 | 0 | 5 |
| igniteui-theming | 45,080 | 14 | 8 | 0 | 0 | 0 | 0 | 2 |
| malicious-mcp-server | 13,851 | 7 | 7 | 0 | 0 | 0 | 0 | 6 |
| mcp-echo-server | 24,467 | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| mcp-gsheets | 15,080 | 44 | 8 | 0 | 0 | 0 | 0 | 10 |
| mcp-hello-world | 143,921 | 3 | 3 | 0 | 0 | 0 | 0 | 3 |
| n8n-mcp | 580,659 | 28 | 8 | 0 | 0 | 0 | 0 | 10 |

Determinism: 522 of 528 trace records were identical across two runs of the same seed. 7 volatile paths were learned rather than assumed: `$.evidence.firstCall.preview`, `$.evidence.firstResult`, `$.evidence.retryResult`, `$.evidence.thirdResult`, `$.msg.result.content[*].text`, `$.msg.result.structuredContent.content`, `$.sha`.

## @modelcontextprotocol/server-filesystem

`npm:@modelcontextprotocol/server-filesystem` &middot; secure-filesystem-server 0.2.0

- **edit_file** (retry-signal) The effect was applied once, but the retry reported failure, which tells a retrying client the operation did not happen.
  - reproduce: `doubletap replay runs/census-v9/filesystem-dt-census-1.dt.jsonl --probe retry-signal --tool edit_file`
- **move_file** (retry-signal) The effect was applied once, but the retry reported failure, which tells a retrying client the operation did not happen.
  - reproduce: `doubletap replay runs/census-v9/filesystem-dt-census-1.dt.jsonl --probe retry-signal --tool move_file`

## @modelcontextprotocol/server-memory

`npm:@modelcontextprotocol/server-memory` &middot; memory-server 0.6.3

- **create_entities** (retry-signal) A retry left the state unchanged but returned a different answer, so a client cannot tell a duplicate from a fresh success.
  - reproduce: `doubletap replay runs/census-v9/memory-dt-census-1.dt.jsonl --probe retry-signal --tool create_entities`
- **create_relations** (retry-signal) A retry left the state unchanged but returned a different answer, so a client cannot tell a duplicate from a fresh success.
  - reproduce: `doubletap replay runs/census-v9/memory-dt-census-1.dt.jsonl --probe retry-signal --tool create_relations`

## @modelcontextprotocol/server-everything

`npm:@modelcontextprotocol/server-everything` &middot; mcp-servers/everything 2.0.0

No retry failures or contract violations among the tools this oracle could decide.

## @upstash/context7-mcp

`npm:@upstash/context7-mcp@4.0.4` &middot; Context7 4.0.4

No retry failures or contract violations among the tools this oracle could decide.

## @notionhq/notion-mcp-server

`npm:@notionhq/notion-mcp-server@2.5.1` &middot; Notion API 1.0.0

- **API-create-a-comment** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/v1/comments byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/notionhq-notion-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool API-create-a-comment`
- **API-create-a-data-source** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/v1/data_sources byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/notionhq-notion-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool API-create-a-data-source`

## n8n-mcp

`npm:n8n-mcp@2.79.1` &middot; n8n-documentation-mcp 2.79.1

No retry failures or contract violations among the tools this oracle could decide.

## @modelcontextprotocol/server-pdf

`npm:@modelcontextprotocol/server-pdf@1.7.5` &middot; PDF Server 2.0.0

No retry failures or contract violations among the tools this oracle could decide.

## hostinger-api-mcp

`npm:hostinger-api-mcp@1.55.0` &middot; hostinger-api-mcp 1.55.0

- **agency-hosting_buildWebsiteNodeJSAssetsV1** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/agency-hosting/v1/websites/dt-e93659/build-assets byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/hostinger-api-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool agency-hosting_buildWebsiteNodeJSAssetsV1`
- **agency-hosting_changeWordPressVersionV1** (upstream-idempotency, same session and after restart) The retry re-sends PATCH <upstream>/api/agency-hosting/v1/websites/dt-9bc7d3/wordpress/settings/version byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/hostinger-api-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool agency-hosting_changeWordPressVersionV1`
- **agency-hosting_createANewWebsiteV1** (upstream-idempotency, same session and after restart) The retry sent a further write to POST <upstream>/api/agency-hosting/v1/orders/8/websites/setups rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/hostinger-api-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool agency-hosting_createANewWebsiteV1`
- **agency-hosting_createWebsiteCronJobV1** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/agency-hosting/v1/websites/dt-e91d84/cron-jobs byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/hostinger-api-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool agency-hosting_createWebsiteCronJobV1`
- **agency-hosting_createWebsiteDatabaseUserV1** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/agency-hosting/v1/websites/dt-edc33f/databases/dt-edc33f/users byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/hostinger-api-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool agency-hosting_createWebsiteDatabaseUserV1`
- **agency-hosting_createWebsiteDatabaseV1** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/agency-hosting/v1/websites/dt-f4c138/databases byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/hostinger-api-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool agency-hosting_createWebsiteDatabaseV1`

## comfyui-mcp

`npm:comfyui-mcp@0.52.180` &middot; comfyui-mcp 0.52.180

No retry failures or contract violations among the tools this oracle could decide.

## @modelcontextprotocol/server-sequential-thinking

`npm:@modelcontextprotocol/server-sequential-thinking@2026.8.31` &middot; sequential-thinking-server 2026.8.31

No retry failures or contract violations among the tools this oracle could decide.

## @ui5/mcp-server

`npm:@ui5/mcp-server@0.2.18` &middot; UI5 0.2.18

No retry failures or contract violations among the tools this oracle could decide.

## @azure-devops/mcp

`npm:@azure-devops/mcp@2.9.0` &middot; Azure DevOps MCP Server 2.9.0

No retry failures or contract violations among the tools this oracle could decide.

## next-devtools-mcp

`npm:next-devtools-mcp@0.4.0` &middot; next-devtools-mcp 0.4.0

- **nextjs_index** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>:3000/_next/mcp byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/next-devtools-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool nextjs_index`

## @serdnaley/metabase-mcp

`npm:@serdnaley/metabase-mcp@0.2.0` &middot; metabase-mcp 0.1.0

- **add_group_member** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/permissions/membership byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/serdnaley-metabase-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool add_group_member`
- **copy_card** (upstream-idempotency, same session and after restart) The retry sent a further write to POST <upstream>/api/card/10/copy rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/serdnaley-metabase-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool copy_card`
- **copy_dashboard** (upstream-idempotency, same session and after restart) The retry sent a further write to POST <upstream>/api/dashboard/3/copy rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/serdnaley-metabase-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool copy_dashboard`
- **create_action** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/action byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/serdnaley-metabase-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create_action`
- **create_action_public_link** (upstream-idempotency, same session and after restart) The retry sent a further write to POST <upstream>/api/action/6/public_link rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/serdnaley-metabase-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create_action_public_link`
- **create_alert** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/alert byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/serdnaley-metabase-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create_alert`
- **create_bookmark** (upstream-idempotency, same session and after restart) The retry sent a further write to POST <upstream>/api/bookmark/card/8 rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/serdnaley-metabase-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create_bookmark`
- **create_card** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/card byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/serdnaley-metabase-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create_card`

## freee-mcp

`npm:freee-mcp@0.34.2` &middot; freee 0.34.2

No retry failures or contract violations among the tools this oracle could decide.

## @perplexity-ai/mcp-server

`npm:@perplexity-ai/mcp-server@1.2.1` &middot; ai.perplexity/mcp-server 1.2.1

No retry failures or contract violations among the tools this oracle could decide.

## @currents/mcp

`npm:@currents/mcp@2.4.2` &middot; currents 2.4.2

- **currents-cancel-run-github-ci** (upstream-idempotency, same session and after restart) The retry sent a further write to PUT <upstream>/runs/cancel-ci/github rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/currents-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool currents-cancel-run-github-ci`
- **currents-create-action** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/actions byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/currents-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool currents-create-action`
- **currents-create-jira-issue** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/projects/dt-0e4749/jira/issues byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/currents-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool currents-create-jira-issue`
- **currents-create-webhook** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/webhooks byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/currents-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool currents-create-webhook`

## mcp-hello-world

`npm:mcp-hello-world@1.1.2` &middot; hello-world 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## @shopify/dev-mcp

`npm:@shopify/dev-mcp@1.15.0` &middot; shopify-dev-mcp 1.15.0

- **feedback** (answer-stability) The second call answered differently from the first at content[*].text and the third agreed with the second, so the server changed its response after the first call and a retrying client is told something the original caller was not.
  - reproduce: `doubletap replay runs/census-v9/shopify-dev-mcp-dt-census-1.dt.jsonl --probe answer-stability --tool feedback`
- **feedback** (upstream-idempotency, after restart) The retry re-sends POST shopify.dev/mcp/usage byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing.
  - reproduce: `doubletap replay runs/census-v9/shopify-dev-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool feedback`
- **learn_shopify_api** (upstream-idempotency, same session and after restart) The retry sent a further write to POST shopify.dev/mcp/usage rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/shopify-dev-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool learn_shopify_api`
- **search_docs_chunks** (upstream-idempotency, same session and after restart) The retry re-sends POST shopify.dev/assistant/search byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/shopify-dev-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool search_docs_chunks`
- **validate_component_codeblocks** (upstream-idempotency, same session and after restart) The retry sent a further write to POST shopify.dev/mcp/usage rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/shopify-dev-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool validate_component_codeblocks`
- **validate_graphql_codeblocks** (upstream-idempotency, same session and after restart) The retry sent a further write to POST shopify.dev/mcp/usage rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/shopify-dev-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool validate_graphql_codeblocks`

## @mastra/mcp-docs-server

`npm:@mastra/mcp-docs-server@1.2.23` &middot; Mastra Documentation Server 1.2.23

No retry failures or contract violations among the tools this oracle could decide.

## @google-cloud/observability-mcp

`npm:@google-cloud/observability-mcp@0.2.3` &middot; observability-mcp 0.2.3

- **get_trace** (answer-stability) The second call answered differently from the first at content[*].text and the third agreed with the second, so the server changed its response after the first call and a retrying client is told something the original caller was not.
  - reproduce: `doubletap replay runs/census-v9/google-cloud-observability-mcp-dt-census-1.dt.jsonl --probe answer-stability --tool get_trace`
- **list_alert_policies** (answer-stability) The second call answered differently from the first at content[*].text and the third agreed with the second, so the server changed its response after the first call and a retrying client is told something the original caller was not.
  - reproduce: `doubletap replay runs/census-v9/google-cloud-observability-mcp-dt-census-1.dt.jsonl --probe answer-stability --tool list_alert_policies`
- **list_alerts** (answer-stability) The second call answered differently from the first at content[*].text and the third agreed with the second, so the server changed its response after the first call and a retrying client is told something the original caller was not.
  - reproduce: `doubletap replay runs/census-v9/google-cloud-observability-mcp-dt-census-1.dt.jsonl --probe answer-stability --tool list_alerts`
- **list_buckets** (answer-stability) The second call answered differently from the first at content[*].text and the third agreed with the second, so the server changed its response after the first call and a retrying client is told something the original caller was not.
  - reproduce: `doubletap replay runs/census-v9/google-cloud-observability-mcp-dt-census-1.dt.jsonl --probe answer-stability --tool list_buckets`
- **list_group_stats** (answer-stability) The second call answered differently from the first at content[*].text and the third agreed with the second, so the server changed its response after the first call and a retrying client is told something the original caller was not.
  - reproduce: `doubletap replay runs/census-v9/google-cloud-observability-mcp-dt-census-1.dt.jsonl --probe answer-stability --tool list_group_stats`
- **list_log_entries** (answer-stability) The second call answered differently from the first at content[*].text and the third agreed with the second, so the server changed its response after the first call and a retrying client is told something the original caller was not.
  - reproduce: `doubletap replay runs/census-v9/google-cloud-observability-mcp-dt-census-1.dt.jsonl --probe answer-stability --tool list_log_entries`
- **list_log_names** (answer-stability) The second call answered differently from the first at content[*].text and the third agreed with the second, so the server changed its response after the first call and a retrying client is told something the original caller was not.
  - reproduce: `doubletap replay runs/census-v9/google-cloud-observability-mcp-dt-census-1.dt.jsonl --probe answer-stability --tool list_log_names`
- **list_log_scopes** (answer-stability) The second call answered differently from the first at content[*].text and the third agreed with the second, so the server changed its response after the first call and a retrying client is told something the original caller was not.
  - reproduce: `doubletap replay runs/census-v9/google-cloud-observability-mcp-dt-census-1.dt.jsonl --probe answer-stability --tool list_log_scopes`

## @taazkareem/clickup-mcp-server

`npm:@taazkareem/clickup-mcp-server@0.14.5` &middot; clickup-mcp-server 0.14.5

No retry failures or contract violations among the tools this oracle could decide.

## context-mode

`npm:context-mode@1.0.169` &middot; context-mode 1.0.169

No retry failures or contract violations among the tools this oracle could decide.

## @hubspot/mcp-server

`npm:@hubspot/mcp-server@0.4.0` &middot; hubspot-mcp-server 0.4.0

- **hubspot-batch-create-associations** (upstream-idempotency, same session and after restart) The retry sent a further write to POST <upstream>/crm/v4/associations/dt-62ea3f/dt-62ea3f/batch/create rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/hubspot-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool hubspot-batch-create-associations`
- **hubspot-batch-create-objects** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/crm/v3/objects/dt-496413/batch/create byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/hubspot-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool hubspot-batch-create-objects`
- **hubspot-batch-update-objects** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/crm/v3/objects/dt-5cbe01/batch/update byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/hubspot-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool hubspot-batch-update-objects`
- **hubspot-create-property** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/crm/v3/properties/dt-d5de8c byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/hubspot-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool hubspot-create-property`

## @bitbonsai/mcpvault

`npm:@bitbonsai/mcpvault@0.16.0` &middot; mcpvault 0.16.0

- **delete_note** (retry-signal) The effect was applied once, but the retry reported failure, which tells a retrying client the operation did not happen.
  - reproduce: `doubletap replay runs/census-v9/bitbonsai-mcpvault-dt-census-1.dt.jsonl --probe retry-signal --tool delete_note`

## @transcend-io/mcp-server-docs

`npm:@transcend-io/mcp-server-docs@0.4.0` &middot; transcend-mcp-docs 0.4.0

No retry failures or contract violations among the tools this oracle could decide.

## @shortcut/mcp

`npm:@shortcut/mcp@0.25.0` &middot; @shortcut/mcp 0.25.0

- **documents-create** (answer-stability) The second call answered differently from the first at content[] and the third agreed with the second, so the server changed its response after the first call and a retrying client is told something the original caller was not.
  - reproduce: `doubletap replay runs/census-v9/shortcut-mcp-dt-census-1.dt.jsonl --probe answer-stability --tool documents-create`
- **documents-create** (upstream-idempotency, same session and after restart) The retry re-sends POST api.app.shortcut.com/api/v3/documents byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/shortcut-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool documents-create`
- **documents-get-by-id** (answer-stability, declares idempotentHint) The second call answered differently from the first at content[] and the third agreed with the second, so the server changed its response after the first call and a retrying client is told something the original caller was not.
  - reproduce: `doubletap replay runs/census-v9/shortcut-mcp-dt-census-1.dt.jsonl --probe answer-stability --tool documents-get-by-id`
- **documents-list** (answer-stability, declares idempotentHint) The second call answered differently from the first at content[] and the third agreed with the second, so the server changed its response after the first call and a retrying client is told something the original caller was not.
  - reproduce: `doubletap replay runs/census-v9/shortcut-mcp-dt-census-1.dt.jsonl --probe answer-stability --tool documents-list`
- **documents-search** (answer-stability, declares idempotentHint) The second call answered differently from the first at content[] and the third agreed with the second, so the server changed its response after the first call and a retrying client is told something the original caller was not.
  - reproduce: `doubletap replay runs/census-v9/shortcut-mcp-dt-census-1.dt.jsonl --probe answer-stability --tool documents-search`
- **documents-update** (answer-stability) The second call answered differently from the first at content[] and the third agreed with the second, so the server changed its response after the first call and a retrying client is told something the original caller was not.
  - reproduce: `doubletap replay runs/census-v9/shortcut-mcp-dt-census-1.dt.jsonl --probe answer-stability --tool documents-update`
- **epics-create** (answer-stability) The second call answered differently from the first at content[] and the third agreed with the second, so the server changed its response after the first call and a retrying client is told something the original caller was not.
  - reproduce: `doubletap replay runs/census-v9/shortcut-mcp-dt-census-1.dt.jsonl --probe answer-stability --tool epics-create`
- **epics-create** (upstream-idempotency, same session and after restart) The retry re-sends POST api.app.shortcut.com/api/v3/epics byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/shortcut-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool epics-create`
- **epics-create-comment** (answer-stability) The second call answered differently from the first at content[] and the third agreed with the second, so the server changed its response after the first call and a retrying client is told something the original caller was not.
  - reproduce: `doubletap replay runs/census-v9/shortcut-mcp-dt-census-1.dt.jsonl --probe answer-stability --tool epics-create-comment`
- **epics-create-comment** (upstream-idempotency, same session and after restart) The retry sent a further write to POST api.app.shortcut.com/api/v3/epics/9/comments rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/shortcut-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool epics-create-comment`

## @google-cloud/storage-mcp

`npm:@google-cloud/storage-mcp@0.6.0` &middot; storage-mcp-server 0.6.0

- **copy_object_safe** (upstream-idempotency, same session and after restart) The retry re-sends POST storage.googleapis.com/storage/v1/b/dt-2ce213/o/%2Fprivate%2Fvar%2Ffolders%2Fsk%2F2dc6gxhx2sx95bx90x1hbg7h0000gn%2FT%2Fdoubletap-google-cloud-storage-mcp-upstream-same-copy_object_safe-X2ZgjT%2Fworkspace%2Fnote.txt/rewriteTo/b/dt-2ce213/o/%2Fprivate%2Fvar%2Ffolders%2Fsk%2F2dc6gxhx2sx95bx90x1hbg7h0000gn%2FT%2Fdoubletap-google-cloud-storage-mcp-upstream-same-copy_object_safe-X2ZgjT%2Fworkspace%2Fdt-2ce213.txt byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/google-cloud-storage-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool copy_object_safe`
- **create_bucket** (upstream-idempotency, same session and after restart) The retry re-sends POST storage.googleapis.com/storage/v1/b byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/google-cloud-storage-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create_bucket`

## @felores/airtable-mcp-server

`npm:@felores/airtable-mcp-server@0.3.0` &middot; airtable-server 0.2.0

- **create_field** (upstream-idempotency, same session and after restart) The retry re-sends POST api.airtable.com/v0/meta/bases/dt-139d6d/tables/dt-139d6d/fields byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/felores-airtable-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create_field`
- **create_record** (upstream-idempotency, same session and after restart) The retry re-sends POST api.airtable.com/v0/dt-a4de2f/dt-a4de2f byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/felores-airtable-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create_record`
- **create_table** (upstream-idempotency, same session and after restart) The retry re-sends POST api.airtable.com/v0/meta/bases/dt-fe4c47/tables byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/felores-airtable-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create_table`

## @ironbee-ai/devtools

`npm:@ironbee-ai/devtools@0.45.0` &middot; ironbee-devtools-mcp 0.45.0

No retry failures or contract violations among the tools this oracle could decide.

## @drawio/mcp

`npm:@drawio/mcp@1.5.0` &middot; drawio-mcp 1.5.0

No retry failures or contract violations among the tools this oracle could decide.

## igniteui-theming

`npm:igniteui-theming@28.1.1` &middot; igniteui-theming 28.1.1

No retry failures or contract violations among the tools this oracle could decide.

## @sellable/mcp

`npm:@sellable/mcp@0.1.920` &middot; sellable-mcp 0.1.920

No retry failures or contract violations among the tools this oracle could decide.

## @productbrain/mcp

`npm:@productbrain/mcp@0.0.1-beta.5290` &middot; Product Brain 0.7.2

- **collections** (upstream-idempotency, same session and after restart) The retry re-sends POST gateway.productbrain.io/api/aki byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/productbrain-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool collections`
- **entries** (upstream-idempotency, same session and after restart) The retry re-sends POST gateway.productbrain.io/api/aki byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/productbrain-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool entries`
- **orient** (upstream-idempotency, same session and after restart) The retry re-sends POST gateway.productbrain.io/api/aki byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/productbrain-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool orient`

## fetcher-mcp

`npm:fetcher-mcp@0.3.9` &middot; browser-mcp 0.1.0

No retry failures or contract violations among the tools this oracle could decide.

## @primer/mcp

`npm:@primer/mcp@1.0.0` &middot; Primer 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## nexus-agents

`npm:nexus-agents@7.0.0` &middot; nexus-agents 7.0.0

- **delegate_to_model** (idempotency, declares idempotentHint) Declares idempotentHint: true, but an identical retry changed the state again (+.nexus-agents/runs/delegate-233e226e/, +.nexus-agents/runs/delegate-233e226e/index.md, +.nexus-agents/runs/delegate-233e226e/trace.jsonl).
  - reproduce: `doubletap replay runs/census-v9/nexus-agents-dt-census-1.dt.jsonl --probe idempotency --tool delegate_to_model`
- **consensus_vote** (upstream-idempotency, same session and after restart) The retry re-sends POST api.anthropic.com/v1/messages byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/nexus-agents-dt-census-1.dt.jsonl --probe upstream-idempotency --tool consensus_vote`

## document-mcp

`npm:document-mcp@4.2.2` &middot; document-mcp 4.2.2

No retry failures or contract violations among the tools this oracle could decide.

## @growthbook/mcp

`npm:@growthbook/mcp@2.1.0` &middot; GrowthBook MCP Thin 2.1.0

- **growthbook_api_write** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream><sandbox>/workspace/dt-b9f57e.txt byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/growthbook-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool growthbook_api_write`

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

- **create-index-for-model** (upstream-idempotency, same session and after restart) The retry re-sends POST api.pinecone.io/indexes/create-for-model byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/pinecone-database-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create-index-for-model`

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

- **google_search** (upstream-idempotency, same session and after restart) The retry re-sends POST google.serper.dev/search byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/serper-search-scrape-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool google_search`
- **scrape** (upstream-idempotency, same session and after restart) The retry re-sends POST scrape.serper.dev/ byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/serper-search-scrape-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool scrape`

## brilliant-directories-mcp

`npm:brilliant-directories-mcp@6.58.608` &middot; brilliant-directories-mcp 6.58.608

- **createCategoryTree** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/v2/list_professions/create byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/brilliant-directories-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool createCategoryTree`
- **createClick** (upstream-idempotency, same session) The retry sent a further write to POST <upstream>/api/v2/users_clicks/create rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first.
  - reproduce: `doubletap replay runs/census-v9/brilliant-directories-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool createClick`
- **createClick** (upstream-idempotency, after restart) The retry re-sends POST <upstream>/api/v2/users_clicks/create byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing.
  - reproduce: `doubletap replay runs/census-v9/brilliant-directories-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool createClick`
- **createDataType** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/v2/data_types/create byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/brilliant-directories-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool createDataType`
- **createEmailTemplate** (upstream-idempotency, same session) The retry re-sends POST <upstream>/api/v2/email_templates/create byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing.
  - reproduce: `doubletap replay runs/census-v9/brilliant-directories-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool createEmailTemplate`
- **createEmailTemplate** (upstream-idempotency, after restart) The retry sent a further write to POST <upstream>/api/v2/email_templates/create rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first.
  - reproduce: `doubletap replay runs/census-v9/brilliant-directories-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool createEmailTemplate`
- **createForm** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/v2/form/create byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/brilliant-directories-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool createForm`
- **createFormField** (upstream-idempotency, same session and after restart) The retry sent a further write to POST <upstream>/api/v2/form_fields/create rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/brilliant-directories-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool createFormField`
- **createLead** (upstream-idempotency, same session and after restart) The retry sent a further write to POST <upstream>/api/v2/leads/create rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/brilliant-directories-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool createLead`
- **createLeadMatch** (upstream-idempotency, same session and after restart) The retry sent a further write to POST <upstream>/api/v2/lead_matches/create rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/brilliant-directories-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool createLeadMatch`

## @ehrocks/fe-mcp-server

`npm:@ehrocks/fe-mcp-server@1.0.10` &middot; hero-design-mcp-server 1.0.10

No retry failures or contract violations among the tools this oracle could decide.

## mcp-echo-server

`npm:mcp-echo-server@1.0.0` &middot; mcp-echo-server 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## @masonator/coolify-mcp

`npm:@masonator/coolify-mcp@2.19.4` &middot; coolify 2.19.4

- **control** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/v1/applications/dt-d47c19/start byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/masonator-coolify-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool control`
- **deploy** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/v1/deploy byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/masonator-coolify-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool deploy`

## @esaio/esa-mcp-server

`npm:@esaio/esa-mcp-server@0.1.0` &middot; esa-mcp-server 0.1.0

No retry failures or contract violations among the tools this oracle could decide.

## @xeroapi/xero-mcp-server

`npm:@xeroapi/xero-mcp-server@0.0.17` &middot; Xero MCP Server 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## @foldkit/devtools-mcp

`npm:@foldkit/devtools-mcp@0.19.3` &middot; @foldkit/devtools-mcp 0.1.0

No retry failures or contract violations among the tools this oracle could decide.

## howtocook-mcp

`npm:howtocook-mcp@0.2.2` &middot; howtocook-mcp 0.2.2

No retry failures or contract violations among the tools this oracle could decide.

## @runpod/mcp-server

`npm:@runpod/mcp-server@3.3.0` &middot; Runpod API Server 3.3.0 [RUNPOD_REST_VERSION unset (default v2)]

- **create-container-registry-auth** (upstream-idempotency, same session and after restart) The retry re-sends POST api.runpod.io/v2/registries byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/runpod-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create-container-registry-auth`
- **create-network-volume** (upstream-idempotency, same session) The retry sent a further write to POST api.runpod.io/v2/network-volumes rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first.
  - reproduce: `doubletap replay runs/census-v9/runpod-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create-network-volume`
- **create-network-volume** (upstream-idempotency, after restart) The retry re-sends POST api.runpod.io/v2/network-volumes byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing.
  - reproduce: `doubletap replay runs/census-v9/runpod-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create-network-volume`
- **create-registry-delegation** (upstream-idempotency, same session and after restart) The retry re-sends POST api.runpod.io/v2/registries/delegations byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/runpod-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create-registry-delegation`
- **create-template** (upstream-idempotency, same session and after restart) The retry re-sends POST api.runpod.io/v2/templates byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/runpod-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create-template`

## samarth-gtm-mcp

`npm:samarth-gtm-mcp@1.483.0` &middot; samarth-gtm-mcp 1.0.0

- **accounts_get** (upstream-idempotency, same session and after restart) The retry re-sends POST oauth2.googleapis.com/token byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/samarth-gtm-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool accounts_get`
- **accounts_list** (upstream-idempotency, same session and after restart) The retry re-sends POST oauth2.googleapis.com/token byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/samarth-gtm-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool accounts_list`
- **audit_container** (upstream-idempotency, same session and after restart) The retry re-sends POST oauth2.googleapis.com/token byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/samarth-gtm-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool audit_container`
- **built_in_variables_list** (upstream-idempotency, same session and after restart) The retry re-sends POST oauth2.googleapis.com/token byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/samarth-gtm-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool built_in_variables_list`

## airtable-mcp-server

`npm:airtable-mcp-server@1.14.0` &middot; airtable-mcp-server 1.14.0

- **create_comment** (upstream-idempotency, same session and after restart) The retry re-sends POST api.airtable.com/v0/dt-a6602e/dt-a6602e/dt-a6602e/comments byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/airtable-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create_comment`
- **create_field** (upstream-idempotency, same session and after restart) The retry re-sends POST api.airtable.com/v0/meta/bases/dt-ffbf5a/tables/dt-ffbf5a/fields byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/airtable-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create_field`
- **create_record** (upstream-idempotency, same session and after restart) The retry re-sends POST api.airtable.com/v0/dt-4b5198/dt-4b5198 byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/airtable-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create_record`
- **create_table** (upstream-idempotency, same session and after restart) The retry re-sends POST api.airtable.com/v0/meta/bases/dt-55029a/tables byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/airtable-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create_table`

## @kolbo/mcp

`npm:@kolbo/mcp@1.86.0` &middot; kolbo 1.0.0

- **acquire_clean_music_track** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/v1/music-library/clean/dt-05988c byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/kolbo-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool acquire_clean_music_track`
- **activate_color_palette** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/v1/color-palettes/dt-eb1e15/activate byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/kolbo-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool activate_color_palette`
- **add_media_to_folder** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/v1/media/folders/%2Fprivate%2Fvar%2Ffolders%2Fsk%2F2dc6gxhx2sx95bx90x1hbg7h0000gn%2FT%2Fdoubletap-kolbo-mcp-upstream-same-add_media_to_folder-AcMms9%2Fworkspace%2Fdt-3e5c9c-dir/items byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/kolbo-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool add_media_to_folder`
- **add_review_version** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/v1/review/assets/dt-ee2874/versions byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/kolbo-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool add_review_version`

## @browserbasehq/mcp

`npm:@browserbasehq/mcp@3.0.0` &middot; Browserbase MCP Server 3.0.0

- **act** (upstream-idempotency, same session and after restart) The retry re-sends POST api.stagehand.browserbase.com/v1/sessions/start byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/browserbasehq-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool act`
- **extract** (upstream-idempotency, same session and after restart) The retry re-sends POST api.stagehand.browserbase.com/v1/sessions/start byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/browserbasehq-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool extract`
- **navigate** (upstream-idempotency, same session and after restart) The retry re-sends POST api.stagehand.browserbase.com/v1/sessions/start byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/browserbasehq-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool navigate`
- **observe** (upstream-idempotency, same session and after restart) The retry re-sends POST api.stagehand.browserbase.com/v1/sessions/start byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/browserbasehq-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool observe`
- **start** (upstream-idempotency, same session and after restart) The retry re-sends POST api.stagehand.browserbase.com/v1/sessions/start byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/browserbasehq-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool start`

## bitbucket-mcp

`npm:bitbucket-mcp@5.0.6` &middot; bitbucket-mcp-server 1.0.0

- **addPendingPullRequestComment** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/repositories/dt-404930/dt-404930/pullrequests/dt-404930/comments byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/bitbucket-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool addPendingPullRequestComment`
- **addPullRequestComment** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/repositories/dt-530957/dt-530957/pullrequests/dt-530957/comments byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/bitbucket-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool addPullRequestComment`
- **approvePullRequest** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/repositories/dt-352960/dt-352960/pullrequests/dt-352960/approve byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/bitbucket-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool approvePullRequest`
- **createDraftPullRequest** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/repositories/dt-4007f6/dt-4007f6/pullrequests byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/bitbucket-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool createDraftPullRequest`
- **createPullRequest** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/repositories/dt-7f7aa5/dt-7f7aa5/pullrequests byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/bitbucket-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool createPullRequest`
- **createPullRequestTask** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/repositories/dt-2d3bd4/dt-2d3bd4/pullrequests/dt-2d3bd4/tasks byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/bitbucket-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool createPullRequestTask`
- **declinePullRequest** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/repositories/dt-1e7f16/dt-1e7f16/pullrequests/dt-1e7f16/decline byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/bitbucket-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool declinePullRequest`

## @coinbase/cds-mcp-server

`npm:@coinbase/cds-mcp-server@9.25.0` &middot; cds 9.25.0

- **get-cds-doc** (upstream-idempotency, same session) The retry re-sends POST api.developer.coinbase.com/analytics byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing.
  - reproduce: `doubletap replay runs/census-v9/coinbase-cds-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool get-cds-doc`
- **get-cds-doc** (upstream-idempotency, after restart) The retry sent a further write to POST api.developer.coinbase.com/analytics rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first.
  - reproduce: `doubletap replay runs/census-v9/coinbase-cds-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool get-cds-doc`
- **list-cds-routes** (upstream-idempotency, same session) The retry re-sends POST api.developer.coinbase.com/analytics byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing.
  - reproduce: `doubletap replay runs/census-v9/coinbase-cds-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool list-cds-routes`
- **list-cds-routes** (upstream-idempotency, after restart) The retry sent a further write to POST api.developer.coinbase.com/analytics rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first.
  - reproduce: `doubletap replay runs/census-v9/coinbase-cds-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool list-cds-routes`

## @amap/amap-maps-mcp-server

`npm:@amap/amap-maps-mcp-server@0.0.8` &middot; mcp-server/amap-maps 0.1.0

No retry failures or contract violations among the tools this oracle could decide.

## @avallon-labs/mcp

`npm:@avallon-labs/mcp@43.1.0` &middot; avallonAPIServer 1.0.0

- **createAgentWebhook** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/v1/voice-agents/dt-9be602/webhooks byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/avallon-labs-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool createAgentWebhook`
- **createApiKey** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/platform/api-keys byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/avallon-labs-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool createApiKey`
- **createArtifact** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/v1/artifacts byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/avallon-labs-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool createArtifact`

## mcp-scraper

`npm:mcp-scraper@0.88.2` &middot; mcp-scraper 0.88.2

- **access-accept-share** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/mcp byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/mcp-scraper-dt-census-1.dt.jsonl --probe upstream-idempotency --tool access-accept-share`
- **access-approve-sender** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/mcp byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/mcp-scraper-dt-census-1.dt.jsonl --probe upstream-idempotency --tool access-approve-sender`
- **access-decline-share** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/mcp byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/mcp-scraper-dt-census-1.dt.jsonl --probe upstream-idempotency --tool access-decline-share`
- **access-inbox-settings** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/mcp byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/mcp-scraper-dt-census-1.dt.jsonl --probe upstream-idempotency --tool access-inbox-settings`
- **access-invite-account** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/mcp byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/mcp-scraper-dt-census-1.dt.jsonl --probe upstream-idempotency --tool access-invite-account`

## @letoribo/mcp-graphql-enhanced

`npm:@letoribo/mcp-graphql-enhanced@4.15.3` &middot; mcp-graphql-enhanced 4.15.3

- **introspect-schema** (upstream-idempotency, same session and after restart) The retry re-sends POST mcp-discord.vercel.app/api/graphiql byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/letoribo-mcp-graphql-enhanced-dt-census-1.dt.jsonl --probe upstream-idempotency --tool introspect-schema`

## ask-experts-mcp

`npm:ask-experts-mcp@0.2.0` &middot; ask-experts 0.1.0

- **ask_doubao** (upstream-idempotency, same session and after restart) The retry re-sends POST ark.cn-beijing.volces.com/api/v3/chat/completions byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/ask-experts-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool ask_doubao`
- **ask_hunyuan** (upstream-idempotency, same session and after restart) The retry re-sends POST api.hunyuan.cloud.tencent.com/v1/chat/completions byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/ask-experts-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool ask_hunyuan`
- **ask_qwen** (upstream-idempotency, same session and after restart) The retry re-sends POST dashscope.aliyuncs.com/compatible-mode/v1/chat/completions byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/ask-experts-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool ask_qwen`

## @jpisnice/shadcn-ui-mcp-server

`npm:@jpisnice/shadcn-ui-mcp-server@2.0.0` &middot; shadcn-ui-mcp-server 2.0.0

No retry failures or contract violations among the tools this oracle could decide.

## @siemens/ix-mcp-react

`npm:@siemens/ix-mcp-react@5.2.1-v.1.11.3` &middot; @siemens/ix-mcp-react 1.0.0

- **ix-icon-search** (upstream-idempotency, same session and after restart) The retry re-sends POST api.siemens.com/llm/v1/embeddings byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/siemens-ix-mcp-react-dt-census-1.dt.jsonl --probe upstream-idempotency --tool ix-icon-search`
- **ix-search** (upstream-idempotency, same session and after restart) The retry re-sends POST api.siemens.com/llm/v1/embeddings byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/siemens-ix-mcp-react-dt-census-1.dt.jsonl --probe upstream-idempotency --tool ix-search`

## @tacticlaunch/mcp-linear

`npm:@tacticlaunch/mcp-linear@1.4.3` &middot; linear 1.4.3

- **linear_addAttachment** (upstream-idempotency, same session and after restart) The retry re-sends POST api.linear.app/graphql byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/tacticlaunch-mcp-linear-dt-census-1.dt.jsonl --probe upstream-idempotency --tool linear_addAttachment`
- **linear_addIssueLabel** (upstream-idempotency, same session and after restart) The retry re-sends POST api.linear.app/graphql byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/tacticlaunch-mcp-linear-dt-census-1.dt.jsonl --probe upstream-idempotency --tool linear_addIssueLabel`
- **linear_addIssueToCycle** (upstream-idempotency, same session and after restart) The retry re-sends POST api.linear.app/graphql byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/tacticlaunch-mcp-linear-dt-census-1.dt.jsonl --probe upstream-idempotency --tool linear_addIssueToCycle`
- **linear_addIssueToProject** (upstream-idempotency, same session and after restart) The retry re-sends POST api.linear.app/graphql byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/tacticlaunch-mcp-linear-dt-census-1.dt.jsonl --probe upstream-idempotency --tool linear_addIssueToProject`
- **linear_addIssueToRelease** (upstream-idempotency, same session and after restart) The retry re-sends POST api.linear.app/graphql byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/tacticlaunch-mcp-linear-dt-census-1.dt.jsonl --probe upstream-idempotency --tool linear_addIssueToRelease`
- **linear_addProjectMember** (upstream-idempotency, same session and after restart) The retry re-sends POST api.linear.app/graphql byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/tacticlaunch-mcp-linear-dt-census-1.dt.jsonl --probe upstream-idempotency --tool linear_addProjectMember`
- **linear_addProjectToInitiative** (upstream-idempotency, same session and after restart) The retry re-sends POST api.linear.app/graphql byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/tacticlaunch-mcp-linear-dt-census-1.dt.jsonl --probe upstream-idempotency --tool linear_addProjectToInitiative`
- **linear_addToFavorites** (upstream-idempotency, same session and after restart) The retry re-sends POST api.linear.app/graphql byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/tacticlaunch-mcp-linear-dt-census-1.dt.jsonl --probe upstream-idempotency --tool linear_addToFavorites`

## agentphone-mcp

`npm:agentphone-mcp@0.7.0` &middot; agentphone 0.7.0

- **attach_number** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/v1/agents/dt-2e143c/numbers byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/agentphone-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool attach_number`
- **create_agent** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/v1/agents byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/agentphone-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create_agent`

## flightradar-mcp-server

`npm:flightradar-mcp-server@0.1.2` &middot; flightradar-mcp-server 0.1.0

No retry failures or contract violations among the tools this oracle could decide.

## @doist/todoist-mcp

`npm:@doist/todoist-mcp@11.0.0` &middot; todoist-mcp-server 11.0.0

- **add-filters** (upstream-idempotency, same session and after restart) The retry sent a further write to POST <upstream>/api/v1/sync rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/doist-todoist-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool add-filters`
- **add-labels** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/v1/labels byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/doist-todoist-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool add-labels`
- **add-projects** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/v1/projects byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/doist-todoist-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool add-projects`
- **add-reminders** (upstream-idempotency, same session and after restart) The retry sent a further write to POST <upstream>/api/v1/reminders rather than the identical one, so the two requests differ in their body and the far end has no way to recognise the second as a duplicate of the first, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/doist-todoist-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool add-reminders`
- **add-sections** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/v1/sections byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/doist-todoist-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool add-sections`
- **add-tasks** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/v1/tasks byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/doist-todoist-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool add-tasks`
- **analyze-project-health** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/api/v1/projects/dt-7a970e/insights/health/analyze byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/doist-todoist-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool analyze-project-health`

## @delorenj/mcp-server-ticketmaster

`npm:@delorenj/mcp-server-ticketmaster@0.2.5` &middot; ticketmaster 0.2.0

No retry failures or contract violations among the tools this oracle could decide.

## @variflight-ai/variflight-mcp

`npm:@variflight-ai/variflight-mcp@1.0.3` &middot; variflight-mcp 1.0.3

- **getRealtimeLocationByAnum** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/ byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/variflight-ai-variflight-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool getRealtimeLocationByAnum`

## @nextscope/mcp

`npm:@nextscope/mcp@0.3.0` &middot; nextscope 0.1.0

- **nextscope_export_trace** (upstream-idempotency, same session and after restart) The retry re-sends POST localhost:3000/_nextscope/mcp byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/nextscope-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool nextscope_export_trace`
- **nextscope_get_spans** (upstream-idempotency, same session and after restart) The retry re-sends POST localhost:3000/_nextscope/mcp byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/nextscope-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool nextscope_get_spans`
- **nextscope_get_trace** (upstream-idempotency, same session and after restart) The retry re-sends POST localhost:3000/_nextscope/mcp byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/nextscope-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool nextscope_get_trace`
- **nextscope_list_servers** (upstream-idempotency, same session and after restart) The retry re-sends POST localhost:3000/_nextscope/mcp byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/nextscope-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool nextscope_list_servers`
- **nextscope_list_spans** (upstream-idempotency, same session and after restart) The retry re-sends POST localhost:3000/_nextscope/mcp byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/nextscope-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool nextscope_list_spans`

## @atlassian-dc-mcp/jira

`npm:@atlassian-dc-mcp/jira@0.34.0` &middot; atlassian-jira-mcp 0.34.0

- **jira_createIssue** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream><placeholder>/api/2/issue byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/atlassian-dc-mcp-jira-dt-census-1.dt.jsonl --probe upstream-idempotency --tool jira_createIssue`
- **jira_linkIssues** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream><placeholder>/api/2/issueLink byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/atlassian-dc-mcp-jira-dt-census-1.dt.jsonl --probe upstream-idempotency --tool jira_linkIssues`

## @tiberriver256/mcp-server-azure-devops

`npm:@tiberriver256/mcp-server-azure-devops@0.1.46` &middot; azure-devops-mcp 0.1.0

No retry failures or contract violations among the tools this oracle could decide.

## mcp-gsheets

`npm:mcp-gsheets@1.10.2` &middot; spreadsheet 1.8.0

No retry failures or contract violations among the tools this oracle could decide.

## @skanda-yutori/mcp-send-email

`npm:@skanda-yutori/mcp-send-email@1.0.0` &middot; email-sending-service 1.0.0

- **send-email** (upstream-idempotency, same session and after restart) The retry re-sends POST api.resend.com/emails byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/skanda-yutori-mcp-send-email-dt-census-1.dt.jsonl --probe upstream-idempotency --tool send-email`

## @rebasepro/mcp

`npm:@rebasepro/mcp@0.17.3` &middot; rebase-mcp-server 0.17.3

No retry failures or contract violations among the tools this oracle could decide.

## malicious-mcp-server

`npm:malicious-mcp-server@1.5.0` &middot; e2e-purposes-malicious-server 1.0.0

No retry failures or contract violations among the tools this oracle could decide.

## hyperbrowser-mcp

`npm:hyperbrowser-mcp@1.0.25` &middot; hyperbrowser 1.0.24

- **browser_use_agent** (upstream-idempotency, same session and after restart) The retry re-sends POST app.hyperbrowser.ai/api/task/browser-use byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/hyperbrowser-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool browser_use_agent`
- **claude_computer_use_agent** (upstream-idempotency, same session and after restart) The retry re-sends POST app.hyperbrowser.ai/api/task/claude-computer-use byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/hyperbrowser-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool claude_computer_use_agent`
- **crawl_webpages** (upstream-idempotency, same session and after restart) The retry re-sends POST app.hyperbrowser.ai/api/crawl byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/hyperbrowser-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool crawl_webpages`
- **create_profile** (upstream-idempotency, same session and after restart) The retry re-sends POST app.hyperbrowser.ai/api/profile byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/hyperbrowser-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create_profile`
- **extract_structured_data** (upstream-idempotency, same session and after restart) The retry re-sends POST app.hyperbrowser.ai/api/extract byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/hyperbrowser-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool extract_structured_data`
- **openai_computer_use_agent** (upstream-idempotency, same session and after restart) The retry re-sends POST app.hyperbrowser.ai/api/task/cua byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/hyperbrowser-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool openai_computer_use_agent`

## alibabacloud-devops-mcp-server

`npm:alibabacloud-devops-mcp-server@0.3.61` &middot; alibabacloud-devops-mcp-server 0.3.61

- **cancel_app_release_stage_execution** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/oapi/v1/appstack/apps/dt-1b5b45/releaseWorkflows/dt-1b5b45/releaseStages/dt-1b5b45/executions/dt-1b5b45:cancel byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/alibabacloud-devops-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool cancel_app_release_stage_execution`
- **cancel_appstack_change_request** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/oapi/v1/appstack/apps/dt-5c6efb/changeRequests/dt-5c6efb:cancel byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/alibabacloud-devops-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool cancel_appstack_change_request`
- **close_appstack_change_request** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/oapi/v1/appstack/apps/dt-895667/changeRequests/dt-895667:finish byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/alibabacloud-devops-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool close_appstack_change_request`
- **create_app_orchestration** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/oapi/v1/appstack/apps/dt-d2f444/orchestrations byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/alibabacloud-devops-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create_app_orchestration`
- **create_app_tag** (upstream-idempotency, same session and after restart) The retry re-sends POST <upstream>/oapi/v1/appstack/appTags byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/alibabacloud-devops-mcp-server-dt-census-1.dt.jsonl --probe upstream-idempotency --tool create_app_tag`

## @delorenj/mcp-server-trello

`npm:@delorenj/mcp-server-trello@1.8.1` &middot; trello-server 1.8.1

- **add_card_to_list** (upstream-idempotency, same session and after restart) The retry re-sends POST api.trello.com/1/cards byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/delorenj-mcp-server-trello-dt-census-1.dt.jsonl --probe upstream-idempotency --tool add_card_to_list`
- **add_cards_to_list** (upstream-idempotency, same session and after restart) The retry re-sends POST api.trello.com/1/cards byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/delorenj-mcp-server-trello-dt-census-1.dt.jsonl --probe upstream-idempotency --tool add_cards_to_list`
- **add_comment** (upstream-idempotency, same session and after restart) The retry re-sends POST api.trello.com/1/cards/dt-b6a984/actions/comments byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/delorenj-mcp-server-trello-dt-census-1.dt.jsonl --probe upstream-idempotency --tool add_comment`
- **assign_member_to_card** (upstream-idempotency, same session and after restart) The retry re-sends POST api.trello.com/1/cards/dt-a611d0/idMembers byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/delorenj-mcp-server-trello-dt-census-1.dt.jsonl --probe upstream-idempotency --tool assign_member_to_card`

## @roychri/mcp-server-asana

`npm:@roychri/mcp-server-asana@1.8.0` &middot; Asana MCP Server 1.8.0

No retry failures or contract violations among the tools this oracle could decide.

## @arizeai/phoenix-mcp

`npm:@arizeai/phoenix-mcp@4.3.7` &middot; phoenix-mcp-server 1.1.0

- **add-dataset-examples** (upstream-idempotency, same session and after restart) The retry re-sends POST localhost:6006/v1/datasets/upload byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/arizeai-phoenix-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool add-dataset-examples`
- **add-prompt-version-tag** (upstream-idempotency, same session and after restart) The retry re-sends POST localhost:6006/v1/prompt_versions/dt-5f616e/tags byte for byte with no idempotency header, and the tool declares no readOnlyHint. Either the retry duplicates a write, or the call is a query and the annotation a gateway would use to know that is missing, both on the live connection and after a reconnect.
  - reproduce: `doubletap replay runs/census-v9/arizeai-phoenix-mcp-dt-census-1.dt.jsonl --probe upstream-idempotency --tool add-prompt-version-tag`

## @vizejs/musea-mcp-server

`npm:@vizejs/musea-mcp-server@0.390.0` &middot; musea-mcp-server 0.0.1-alpha.11

No retry failures or contract violations among the tools this oracle could decide.
