# mcp-exec-team

Multi-persona debate engine exposed as an MCP (Model Context Protocol) server. Run structured roundtable discussions where AI personas deliberate sequentially, react naturally, and log decisions.

## Why This Exists

Multi-agent systems tend to produce noise. Everyone "agrees," every agent dumps everything they know, and the output is 10x longer than it needs to be. This engine solves three problems:

1. **Sequential turns** -- each persona sees what came before and builds on it, instead of everyone talking past each other in parallel.
2. **[PASS] rule** -- if a persona has nothing to add, they say `[PASS]` and stay silent. No filler.
3. **Sparse reactions** -- 1-3 natural reactions max, no self-reactions, no performative agreement.

The result is a focused executive meeting, not a group chat.

## Key Innovations

**Sequential Roundtable** -- Each persona sees what previous speakers said
before responding. This creates genuine dialogue, not parallel monologues.

**The [PASS] Rule** -- Personas respond with `[PASS]` when they have nothing
to add. In multi-agent systems, the biggest problem is response bloat.
Silence is a feature, not a bug.

**Sparse Reactions** -- After the roundtable, 1-3 natural reactions are
generated. A persona never reacts to their own turn. Most personas stay
quiet. This prevents the "everyone nods and says good point" pattern.

**War Room Constraints** -- Responses capped at 2-4 sentences. One point
per turn. No info-dumping. Keeps debates focused and actionable.

## How It Works

```
Question --> Persona 1 speaks --> Persona 2 sees P1, speaks --> Persona 3 sees P1+P2, speaks
    |
    v
Reactions generated (1-3 max, no self-reactions)
    |
    v
Decision logged with approver
```

Each persona receives the full transcript of previous speakers as context.
This means Persona 3 can disagree with Persona 1, build on Persona 2,
or say `[PASS]` if both already covered their point. The conversation
converges naturally instead of repeating itself.

## Example

```
User: "Should we mass-migrate customers to the new API or run both
       versions for 6 months?"

Product Manager: "Run both. We have 200+ integrations and breaking
them on a deadline is how you lose customers. Deprecation warnings
now, hard cutoff in 6 months, migration guide by end of week."

Staff Engineer: "Running both doubles our maintenance surface. Every
bug fix ships twice, every deploy tests twice. I'd cut it to 3 months
max and put a migration script in the SDK so customers can self-serve."

Security Lead: "The old API has no rate limiting and the auth tokens
don't expire. Every month we run both is another month that's
exploitable. 3 months, but only if we backport rate limiting to v1
immediately."

[Reactions]
Product Manager reacts to Security Lead: "didn't know about the
token expiry gap -- that changes the risk calculus"

Staff Engineer reacts to Security Lead: "agreed, rate limiting
backport is a 2-day job, non-negotiable"

[Decision: "3-month dual-run with rate limiting backported to v1
within 1 week. SDK migration script ships in 2 weeks. Hard cutoff
August 1." -- approved by Product Manager]
```

Three personas. Five total messages. A decision with a deadline. No filler.

## Install

```bash
git clone https://github.com/protectyr-labs/mcp-exec-team.git
cd mcp-exec-team
npm install
npm run build
```

## MCP Server Setup

Add to your `claude_desktop_config.json` (typically at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "exec-team": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-exec-team/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

The server runs over stdio. No HTTP, no ports, no configuration beyond the API key.

After saving, restart Claude Desktop. The exec-team tools will appear in the tools menu.

## MCP Tools

### `invoke_debate`

Run a sequential roundtable debate among selected personas.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `persona_ids` | `string[]` | Yes | Which personas participate |
| `question` | `string` | Yes | The topic for debate |
| `context` | `string` | No | Background information |

Returns a `DebateResult` with turns, reactions, topic, and timestamp.

### `invoke_single`

Ask one persona a question directly.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `persona_id` | `string` | Yes | The persona to ask |
| `question` | `string` | Yes | Your question |
| `context` | `string` | No | Background information |

### `get_persona`

Inspect a persona's configuration and prompt content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `persona_id` | `string` | Yes | The persona to inspect |

### `log_decision`

Record a decision made during or after a debate.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `summary` | `string` | Yes | One-line decision summary |
| `context` | `string` | Yes | What led to this decision |
| `approver` | `string` | Yes | Who approved it |

### `generate_minutes`

Produce meeting minutes from a debate result.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `debate_result` | `object` | Yes | The DebateResult from invoke_debate |
| `focus_areas` | `string[]` | No | Areas to highlight |

## Demo Personas

Three personas are included for demonstration:

- **Product Manager** (`product-manager`) -- Pragmatic, ships MVPs, fights scope creep
- **Staff Engineer** (`staff-engineer`) -- Reliability-focused, thinks about debt and performance
- **Security Lead** (`security-lead`) -- Risk-oriented, requires threat models and compliance

Add your own by dropping `.md` files into the `personas/` directory. Each file becomes a persona with an ID matching the filename (without extension).

## Custom Personas

Create a markdown file in `personas/`:

```markdown
# Data Architect

You are a data architect focused on schema design and data flow.
You think about normalization, query patterns, and migration safety.

## Current Priorities
- Migrate from MongoDB to PostgreSQL
- Design event sourcing schema
- Reduce query complexity on the reporting pipeline
```

The persona is automatically available by its filename ID (e.g., `data-architect`).

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for design rationale covering:
- Why sequential turns over parallel
- Why sparse reactions prevent noise
- Why the [PASS] rule matters
- Known limitations and tradeoffs

## Development

```bash
npm install
npm run build
npm test
```

Tests run pure logic only (no API calls required).

## License

MIT
