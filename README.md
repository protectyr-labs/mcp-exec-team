# mcp-exec-team

Multi-persona debate engine exposed as an MCP (Model Context Protocol) server. Run structured roundtable discussions where AI personas deliberate sequentially, react naturally, and log decisions.

## Why This Exists

Multi-agent systems tend to produce noise. Everyone "agrees," every agent dumps everything they know, and the output is 10x longer than it needs to be. This engine solves three problems:

1. **Sequential turns** -- each persona sees what came before and builds on it, instead of everyone talking past each other in parallel.
2. **[PASS] rule** -- if a persona has nothing to add, they say `[PASS]` and stay silent. No filler.
3. **Sparse reactions** -- 1-3 natural reactions max, no self-reactions, no performative agreement.

The result is a focused executive meeting, not a group chat.

## Example

```
User: "Ask the team: Should we rewrite the auth system or patch it?"

Product Manager: "Patch it. We have a launch in 3 weeks and a rewrite
delays everything. The current auth works -- it's just ugly."

Staff Engineer: "The tech debt compounds. Every patch adds another
special case to the middleware. I'd budget 2 sprints for a clean
rewrite after launch, but patch now."

Security Lead: "Patching auth is how breaches happen. If we patch,
I need a threat model review of every change. That alone is 3 days."

[Reactions]
Staff Engineer reacts to Security Lead: "important"

[Decision: "Patch now with threat model review per change. Rewrite in Q3."]
```

## Install

```bash
git clone https://github.com/protectyr-labs/mcp-exec-team.git
cd mcp-exec-team
npm install
npm run build
```

## MCP Server Setup

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "exec-team": {
      "command": "node",
      "args": ["/path/to/mcp-exec-team/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

The server runs over stdio. No HTTP, no ports, no configuration beyond the API key.

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
