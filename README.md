<div align="center">

<img src="docs/assets/banner.svg" alt="mcp-exec-team: multi-persona debate engine as MCP server" width="100%"/>

</div>

# mcp-exec-team

A multi-persona debate engine exposed as an MCP server. Multiple AI personas discuss a topic in sequence, each seeing what others said. Personas with nothing important to add respond with `[PASS]` instead of generating filler. The result is a roundtable that reads like a real meeting, not parallel monologues.

[![CI](https://github.com/protectyr-labs/mcp-exec-team/actions/workflows/ci.yml/badge.svg)](https://github.com/protectyr-labs/mcp-exec-team/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-informational?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-9D78E2?style=flat-square)](https://modelcontextprotocol.io)
[![Status](https://img.shields.io/badge/status-stable-success?style=flat-square)]()

## Quick start

```bash
git clone https://github.com/protectyr-labs/mcp-exec-team.git
cd mcp-exec-team
npm install && npm run build
```

Register with Claude Desktop via `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "exec-team": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-exec-team/dist/index.js"],
      "env": { "ANTHROPIC_API_KEY": "sk-ant-..." }
    }
  }
}
```

## Architecture

```mermaid
flowchart LR
    U["Question<br/><sub>from caller</sub>"]
    P1["Persona 1<br/><sub>sees nothing before</sub>"]
    P2["Persona 2<br/><sub>sees P1</sub>"]
    P3["Persona 3<br/><sub>sees P1, P2</sub>"]
    O["Observer<br/><sub>generates 1-3 sparse reactions</sub>"]
    D["Decision<br/><sub>logged with approver</sub>"]
    U --> P1 --> P2 --> P3 --> O --> D
    P1 -.->|"or [PASS]"| P2
    P2 -.->|"or [PASS]"| P3
    style U fill:#1e293b,stroke:#64748b,color:#cbd5e1
    style P1 fill:#0f172a,stroke:#60a5fa,color:#93c5fd
    style P2 fill:#0f172a,stroke:#34d399,color:#6ee7b7
    style P3 fill:#0f172a,stroke:#fb923c,color:#fdba74
    style O fill:#0f172a,stroke:#a78bfa,color:#c4b5fd
    style D fill:#064e3b,stroke:#10b981,color:#a7f3d0
```

Each persona is sequential, not parallel. Turn N sees turns 1 to N-1 in full. The final observer pass generates sparse reactions (never self-reactions, max 3 total, never performative agreement). See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full design rationale.

> [!NOTE]
> This is a real MCP server, not a standalone CLI. Calls are made through the Model Context Protocol via Claude Desktop or any MCP-compatible host. Latency scales linearly with persona count because turns are sequential by design.

## Example

Input: "Mass-migrate customers to the new API or run both versions for 6 months?"

```
Product Manager: "Run both. We have 200+ integrations and breaking them on a
deadline is how you lose customers. Deprecation warnings now, hard cutoff in
6 months, migration guide by end of week."

Staff Engineer: "Running both doubles our maintenance surface. Every bug fix
ships twice. I'd cut it to 3 months max and put a migration script in the SDK."

Security Lead: "The old API has no rate limiting and auth tokens don't expire.
Every month we run both is another month that's exploitable. 3 months, but
only if we backport rate limiting to v1 immediately."

[Reactions]
Product Manager -> Security Lead: "didn't know about the token expiry gap;
that changes the risk calculus"
Staff Engineer -> Security Lead: "agreed, rate limiting backport is a 2-day
job, non-negotiable"

[Decision]
3-month dual-run with rate limiting backported to v1 within 1 week.
SDK migration script ships in 2 weeks. Hard cutoff August 1.
Approved by Product Manager.
```

Three personas. Five messages. A decision with a deadline. No filler.

## Design decisions

Named like ADRs. Full rationale in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

- **D-01: Sequential turns, not parallel.** Parallel calls produce N disconnected monologues. Sequential turns produce a conversation where each speaker can reference what came before. Tradeoff: 3x wall-clock time on a 3-persona roundtable, which is acceptable because roundtables are not latency-sensitive.

- **D-02: `[PASS]` is a first-class response.** Response bloat is the number one failure mode in multi-agent systems. The `[PASS]` rule ("respond with exactly `[PASS]` and nothing else if you have nothing important to add") triggers 20 to 30 percent of turns in practice. The remaining responses are higher signal.

- **D-03: Reactions come from an observer pass, not from personas.** Earlier experiments had every persona react to every other persona. The result was a wall of "I agree with the engineer" noise. Separating reactions into a dedicated observer pass with a hard cap of 3 reactions (and no self-reactions) produces the occasional high-signal nudge without the performative chatter.

- **D-04: War Room mode constrains responses to 2-4 sentences.** Without this, personas write 2-3 paragraphs covering every angle. The constraint forces prioritization: what is the one thing this persona needs to say right now? Four response types allowed: propose a concrete option, ask a specific question, give one number or fact, or call out one risk.

- **D-05: Personas are markdown files, not code.** Drop a `.md` file into `personas/` and it becomes available by filename. Zero-code extension means domain experts (security, legal, product) can author their own personas without knowing TypeScript.

## MCP tools

| Tool | Description |
|------|-------------|
| `invoke_debate` | Run a sequential roundtable among selected personas |
| `invoke_single` | Ask one persona a question directly |
| `get_persona` | Inspect a persona's configuration and prompt |
| `log_decision` | Record a decision with context and approver |
| `generate_minutes` | Produce meeting minutes from a debate result |

## Custom personas

Drop a `.md` file into `personas/` and it becomes available by filename. Three demo personas ship with the repo: `product-manager`, `staff-engineer`, `security-lead`.

```markdown
# Data Architect
You are a data architect focused on schema design and data flow.

## Current Priorities
- Migrate from MongoDB to PostgreSQL
- Enforce schema-on-write for all new tables
- Reduce query depth over 3 joins
```

The file's level-1 heading becomes the display name. Level-2 headings become structured context injected into the persona's prompt on every turn.

## Use cases

**Solo founders and small teams.** You need to decide whether to raise prices, hire a contractor, or pivot. Instead of guessing, ask a virtual exec team. The PM argues user impact, the engineer flags tech debt, the security lead warns about compliance. Three perspectives in 30 seconds.

**Pre-decision review for AI agent pipelines.** Route irreversible actions through a debate before execution. The `[PASS]` rule ensures only relevant agents weigh in.

**Strategic planning simulations.** Test how roles would react to a proposal before presenting it to real stakeholders. "How would a CFO react to this budget?" "What would a security lead flag?"

## Limitations

- Requires an Anthropic API key (Claude model).
- Sequential turns are slower than parallel, by design.
- No streaming of individual turns (full response per persona).
- Demo personas are generic. Real value comes from domain-specific personas authored by actual domain experts.

## Origin

Extracted from a production orchestration system where multiple AI advisors weigh in on cross-functional decisions. Sanitized for open source with fresh git history. No client data, no business secrets, no organization-specific personas. Related repo: [`mcp-starter`](https://github.com/protectyr-labs/mcp-starter) (the template this was built from).

## Links

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — design decisions in depth
- [`LICENSE`](./LICENSE) — MIT
- [Model Context Protocol](https://modelcontextprotocol.io) — the protocol spec
