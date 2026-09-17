# Malicious loader removed — 2026-09-17

## Containment

- Deleted `.vscode/tasks.json`, which ran `node ./public/fonts/fa-solid-500.woff2` on folder open under the misleading task name `eslint-check`, with terminal output hidden.
- Deleted `public/fonts/fa-solid-500.woff2`: obfuscated JavaScript disguised as a font.
- Changed the incoming `task.allowAutomaticTasks` setting to false and removed its nested folder-open task configuration. Removing the actual task file is the primary containment; this report does not rely on the setting being recognized by VS Code.
- Staged the removals and settings change. The merge remains uncommitted.
- Original evidence remains in Git commit `c6045ed3d5c9615b5c6d117a59c83c396c90af75`. Do not restore or execute the payload.

## Static findings

The payload was inspected as text. Its string table was decoded through string extraction and bounded arithmetic; the suspect JavaScript was not evaluated or executed. No payload servers were contacted and no second-stage code was downloaded.

1. Uses Ethereum RPC providers and a Blockscout indexer to locate transactions from a fixed sender address.
2. Decodes two IPv4 addresses from the recipient address of a matching transaction. This lets the operator change server addresses through blockchain transactions.
3. Fetches additional code using plain HTTP on port 443 at `/0x/cls` and `/0x/ls`. It can read encoded content from the response body or the `x-payload-b64` header, with GET/HEAD fallback.
4. Decodes downloaded content with repeating-key XOR, supplies globals including `require` and `module`, then executes downloaded JavaScript through hidden, detached `node -e` processes. One path also uses `eval` in the current process.
5. Suppresses errors. The exact behavior of the downloaded stages, including potential data theft or persistence, is unknown.

This is a malicious remote-code loader, unrelated to Facebook ad blocking. No malware-family or actor attribution was established.

## Indicators

- Payload SHA-256: `9e286f7a54f071e5a4e9f09de84abca872d8347cbb7059c966c7db54a7e4dcba`
- Embedded identifier / Sec-V header value: `A10-*050`
- Ethereum sender: `0xa322e5f3d311d3080e6f0121063e9adc2490ef1a`
- Payload paths: `/0x/cls`, `/0x/ls`
- Response header: `x-payload-b64`
- Bootstrap services: `eth.blockscout.com`, `1rpc.io`, `eth.drpc.org`, `ethereum-rpc.publicnode.com`, `eth-mainnet.public.blastapi.io`. These are infrastructure used by the loader, not evidence that the services themselves are malicious.
- Server IPs are obtained dynamically; they were not resolved during this investigation.

## Local evidence and limits

- The incoming commit introduced the launcher, disguised script, unrelated editor configuration, and font files. Commit authorship metadata is not proof of who inserted the payload.
- Both running Node processes checked belonged to Chrome DevTools MCP; neither contained the payload indicators examined.
- No matching indicators were found in existing VS Code logs, scheduled-task actions, or the current user's Run/RunOnce entries. These checks were indicator-based, not a complete persistence audit.
- Defender antivirus and real-time protection were enabled. No Defender detections matching the repository or disguised filename were returned. A full antivirus scan was not run.
- Remaining font files have expected format headers; SVG scans found no script, onload, javascript URL, or foreignObject markers. This is a limited inspection, not proof all incoming files are safe.
- No active non-sample Git hooks or configured hooksPath were found.
- No evidence of execution was found in these checks. Past execution and unknown second-stage effects cannot be excluded.

## Follow-up

Inspect the other device and the remote repository's access history to establish how the incoming commit acquired these files. Avoid reopening a checkout that still contains the launcher. If the task ran on either device, treat that device as potentially compromised: isolate it, perform an offline/full security scan, and revoke exposed developer credentials and sessions from a clean device. Repository cleanup alone cannot remediate a previously executed second stage.
