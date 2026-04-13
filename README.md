# mcp-exec-team

> A virtual executive team you can consult anytime. Multiple AI personas discuss your question in sequence — each sees what others said. Personas that have nothing to add say `[PASS]` instead of generating filler.

[![CI](https://github.com/protectyr-labs/mcp-exec-team/actions/workflows/ci.yml/badge.svg)](https://github.com/protectyr-labs/mcp-exec-team/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)

Multiple AI personas discuss a topic in sequence. Each sees what others said. Personas that have nothing to add say `[PASS]` instead of generating filler. After the roundtable, 1-3 sparse reactions are generated -- no self-reactions, no performative agreement.

## Quick Start

```bash
git clone https://github.com/protectyr-labs/mcp-exec-team.git
cd mcp-exec-team
npm install && npm run build
```

Add to `claude_desktop_config.json`:

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

## Example

```
User: "Mass-migrate customers to the new API or run both versions for 6 months?"

Product Manager: "Run both. We have 200+ integrations and breaking them on a
deadline is how you lose customers. Deprecation warnings now, hard cutoff in
6 months, migration guide by end of week."

Staff Engineer: "Running both doubles our maintenance surface. Every bug fix
ships twice. I'd cut it to 3 months max and put a migration script in the SDK."

Security Lead: "The old API has no rate limiting and auth tokens don't expire.
Every month we run both is another month that's exploitable. 3 months, but
only if we backport rate limiting to v1 immediately."

[Reactions]
Product Manager â†’ Security Lead: "didn't know about the token expiry gap â€”
that changes the risk calculus"
Staff Engineer â†’ Security Lead: "agreed, rate limiting backport is a 2-day
job, non-negotiable"

[Decision: "3-month dual-run with rate limiting backported to v1 within
1 week. SDK migration script ships in 2 weeks. Hard cutoff August 1."
â€” approved by Product Manager]
```

Three personas. Five messages. A decision with a deadline. No filler.

## Why This?

- **Sequential, not parallel** -- personas respond to each other, not talk past each other
- **`[PASS]` rule** -- silence is a feature; prevents the #1 problem in multi-agent systems (response bloat)
- **Sparse reactions** -- 1-3 max, never self-react; real meetings have silence
- **War Room mode** -- 2-4 sentences per turn, one point only, no info-dumps

## Use Cases

**Solo founders and small teams** — You're running a company alone. You need
to decide whether to raise prices, hire a contractor, or pivot your product.
Instead of guessing, you ask your virtual exec team. The PM argues for user
impact, the engineer flags technical debt, the security lead warns about
compliance risk. You get 3 perspectives in 30 seconds.

**Strategic decision support** — Before committing to a major decision
(new market, technology migration, partnership), run it through a roundtable.
The sequential format means each persona responds to what others said —
not parallel monologues.

**AI agent governance** — You have multiple AI agents in a pipeline. Before
they take an irreversible action, route the decision through a debate.
The [PASS] rule ensures only relevant agents weigh in.

**Team simulation for planning** — Test how different roles would react
to a proposal before presenting it to real stakeholders. "How would a
CFO react to this budget?" "What would a security lead flag?"

## MCP Tools

| Tool | Description |
|------|-------------|
| `invoke_debate` | Run a sequential roundtable among selected personas |
| `invoke_single` | Ask one persona a question directly |
| `get_persona` | Inspect a persona's configuration and prompt |
| `log_decision` | Record a decision with context and approver |
| `generate_minutes` | Produce meeting minutes from a debate result |

## Custom Personas

Drop a `.md` file into `personas/` and it becomes available by filename. Three demo personas are included: `product-manager`, `staff-engineer`, `security-lead`.

```markdown
# Data Architect
You are a data architect focused on schema design and data flow.
## Current Priorities
- Migrate from MongoDB to PostgreSQL
```

## Limitations

- Requires Anthropic API key (Claude model)
- Sequential turns are slower than parallel (trade-off for coherent dialogue)
- No streaming of individual turns (full response per persona)
- Demo personas are generic -- real value comes from domain-specific personas

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions.

Built with the patterns from [mcp-starter](https://github.com/protectyr-labs/mcp-starter).

## License

MIT
