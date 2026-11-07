# Logseq Version Compatibility and API Differences

This document records API differences across Logseq versions (OG 1.x, 0.10.x, 2.x DB graph) and the compatibility status of this plugin.

## 1. Logseq Version System

Logseq has multiple version lines, each with different APIs and behavioral characteristics.

### Version Classification

| Line | Version | Graph Type | UI | Notes |
|------|---------|------------|-----|-------|
| **OG 1.x** | 1.0.0 - 1.x.x | File graph (Markdown) | Legacy UI | Initial version, datascript-based |
| **0.10.x** | 0.10.0 - 0.10.15 | File graph (Markdown) | Legacy UI | Stable release, mature plugin ecosystem |
| **0.11.x** | 0.11.0+ | File graph/DB graph | New UI | Experimental DB graph support |
| **2.x** | 2.0.0+ | DB graph (default) | New UI | DB-based graph, file graph also supported |

### App Generation Detection

Detection logic implemented in `src/logseqModelCheck.ts`:

```typescript
// DB era (new UI) = major>=2 or 0.11.x
// OG 1.x is on the MD version side (legacy UI)
const isDbEra = m ? (Number(m[1]) >= 2 || (Number(m[1]) === 0 && Number(m[2]) >= 11)) : false
```

### Graph Type Detection

```typescript
// Use logseq.App.checkCurrentIsDbGraph()
// Not implemented in 0.10.x → returns null
const isDbGraph = (await checkLogseqDbGraph()) ?? false
```

**Important**: `checkCurrentIsDbGraph()` was added as an official API in `@logseq/libs` 0.3.4, but it is not implemented in Logseq 0.10.x hosts. When it returns `null`, treat it as a file graph.

## 2. `@logseq/libs` Version Differences

### Version Comparison

| Version | Release Date | Notes |
|---------|-------------|-------|
| 0.0.17 | 2023-12-30 | Version before upgrade |
| 0.2.0 | 2024-08-14 | First release of 0.2.x |
| 0.2.12 | 2026-01-19 | Latest of 0.2.x |
| 0.3.4 | 2026-06-24 | Currently used in this project |

### API Changes (0.0.17 → 0.3.4)

#### Removed APIs

| API | Change | Impact |
|-----|--------|--------|
| `isPageBlock` in `insertBlock` | Removed from options | Fixed in `src/journals/monthlyJournal.ts`, `src/journals/utils.ts` |

#### Added APIs

| API | Description |
|-----|-------------|
| `logseq.App.checkCurrentIsDbGraph()` | Check if current graph is a DB graph |
| `logseq.App.getCurrentGraphConfigs()` | Get graph configuration |
| `logseq.App.setCurrentGraphConfigs()` | Set graph configuration |
| `logseq.Editor.getTodayPage()` | Get today's journal page |

#### Changed APIs

| API | 0.0.17 | 0.3.4 |
|-----|--------|-------|
| `openInRightSidebar` | `BlockUUID \| EntityID` | `BlockUUID \| EntityID \| RendererKey` |
| `getCurrentGraphRecent` | `Array<string>` | `Array<string \| PageEntity>` |
| `getCurrentGraphFavorites` | `Array<string>` | `Array<string \| PageEntity>` |

#### Dependency Changes

| Package | 0.0.17 | 0.3.4 |
|---------|--------|-------|
| `dompurify` | 2.3.8 | 3.3.3 |
| `csstype` | 3.1.0 | 3.2.x |
| `debug` | 4.3.4 | 4.4.x |
| `eventemitter3` | 4.0.7 | 5.0.4 |
| `lodash-es` | 4.17.21 | 4.17.23 |
| `snake-case` | 3.0.4 | Removed |
| `change-case` | Not present | Added |

## 3. DB Graph Specific API Behavior

In DB graphs (Logseq 2.x), the following APIs behave differently from file graphs.

### 3.1 `logseq.App.pushState()`

**File graph**:
```typescript
logseq.App.pushState('page', { name: pageName })
// Example: logseq.App.pushState('page', { name: '2026/11/07' })
```

**DB graph**:
```typescript
// On DB graphs, you need to pass the UUID with the name key
logseq.App.pushState('page', { name: pageUuid })
// Example: logseq.App.pushState('page', { name: 'a1b2c3d4-e5f6-...' })
```

**Note**: The `{ uuid: pageUuid }` format does not work. The `{ name: pageUuid }` format is required. This is a DB graph-specific behavior not documented in the official documentation.

### 3.2 `logseq.Editor.getPage()`

On DB graphs, searching by page name may not work in some cases, especially:

- Page names containing slashes (e.g., `2026/11/07`)
- Page names changed by custom date formatters

**Workaround**: Three-stage fallback search (implemented in `src/lib/page_operations.ts`)

1. **Direct search**: `logseq.Editor.getPage(pageName)`
2. **Format conversion**: Retry by converting slashes to dashes
3. **journalDay query**: Datascript query in `yyyyMMdd` format

### 3.3 `logseq.DB.datascriptQuery()`

On DB graphs, datascript queries may return different results than on file graphs.

**`:block/name` issue**:
- On DB graphs, `:block/name` is not updated when changed by custom date formatters
- You need to include both `:block/title` and `:block/original-name` in search targets

**`:block/file` issue**:
- The `:block/file` attribute does not exist on DB graphs
- File existence check (`doesPageFileExist`) is only valid on file graphs

### 3.4 Weekly Journal Hierarchy

On DB graphs, weekly journals are saved as child pages of the year page:

```
Library
└── 2026
    ├── W01
    ├── W02
    └── ...
```

The `findDbWeeklyPageUuid` function performs hierarchical search by parent page (`src/lib/query/advancedQuery.ts`).

### 3.5 Page Creation Limitations

On DB graphs, page names containing slashes (`/`) cannot be created.

- **Daily journals**: `yyyy/MM/dd` → needs to be changed to `yyyy-MM-dd`
- **Weekly journals**: `2024/W01` → needs to be changed to `2024-W01`
- **Monthly journals**: `yyyy/MM` can be created

### 3.6 Impossibility of Auto-Creating Weekly Pages

On DB graphs, it is **impossible** to automatically create weekly pages (e.g., `W42`) as children of a year page (e.g., `2026`) via the plugin API.

**Investigation results**:
- `logseq.Editor.createPage()` silently fails on DB graphs (page is not created)
- `:block/namespace` cannot be set directly from the plugin API
- The `Extends` property is for tag parent relationships, not for page namespaces
- `logseq.DB.datascriptQuery()` is read-only; transaction (`tx`) API does not exist in type definitions

**Workaround**:
- When a weekly page is not found, display a message guiding manual creation (`createDbWeeklyPage` in `src/lib/page_operations.ts`)
- Guide users to create manually with the following steps:
  1. Open Library
  2. Open the year page (e.g., "2026")
  3. Add `[[W42]]` as a child block
  4. Convert `[[W42]]` to a page with `#Page` tag

## 4. API Usage in Codebase

Version compatibility status of Logseq APIs used in this plugin:

### 4.1 `logseq.App`

| API | File graph | DB graph | Notes |
|-----|:---:|:---:|------|
| `getInfo()` | ✅ | ✅ | Get version |
| `getUserConfigs()` | ✅ | ✅ | Get user config |
| `checkCurrentIsDbGraph()` | ❌ | ✅ | Not implemented in 0.10.x |
| `pushState()` | ✅ | ✅ | Format differs on DB graphs |
| `onRouteChanged()` | ✅ | ✅ | Route change event |
| `onPageHeadActionsSlotted()` | ✅ | ✅ | Page header event |
| `onTodayJournalCreated()` | ✅ | ✅ | Today journal created event |
| `onCurrentGraphChanged()` | ✅ | ✅ | Graph change event |
| `invokeExternalCommand()` | ✅ | ✅ | Not in type definitions, via `(as any)` |

### 4.2 `logseq.Editor`

| API | File graph | DB graph | Notes |
|-----|:---:|:---:|------|
| `getPage()` | ✅ | ⚠️ | May not find pages on DB graphs |
| `getCurrentPage()` | ✅ | ✅ | Get current page |
| `createPage()` | ✅ | ❌ | Silently fails on DB graphs (weekly page auto-creation impossible) |
| `insertBlock()` | ✅ | ✅ | `isPageBlock` removed in 0.3.4 |
| `openInRightSidebar()` | ✅ | ✅ | Open in right sidebar |
| `getPageBlocksTree()` | ✅ | ✅ | Get page block tree |

### 4.3 `logseq.DB`

| API | File graph | DB graph | Notes |
|-----|:---:|:---:|------|
| `datascriptQuery()` | ✅ | ✅ | Execute query |

**Query notes**:
- `:block/file` attribute is only valid on file graphs
- `:block/journal-day` is valid on both
- Behavior of `:block/name` vs `:block/title` may differ

### 4.4 `logseq.UI`

| API | File graph | DB graph | Notes |
|-----|:---:|:---:|------|
| `showMsg()` | ✅ | ✅ | Display message |

## 5. Unofficial APIs

APIs that do not exist in type definitions and are used via `(logseq.App as any)`:

| API | Usage location | Notes |
|-----|---------------|-------|
| `invokeExternalCommand()` | `src/lib/page_operations.ts` | Used to open settings |

These APIs may change in future versions, so use them with caution.

## 6. Known Issues and Workarounds

### 6.1 Page Search Failure on DB Graphs

**Issue**: `logseq.Editor.getPage()` cannot search by page name

**Workaround**: Three-stage fallback search (`src/lib/page_operations.ts`)

### 6.2 pushState Format on DB Graphs

**Issue**: `{ uuid: pageUuid }` format does not work

**Workaround**: Use `{ name: pageUuid }` format (`src/lib/page_operations.ts`)

### 6.3 File Existence Check on File Graphs

**Issue**: `:block/file` attribute does not exist on DB graphs

**Workaround**: `doesPageFileExist()` is only used on file graphs (`src/lib/query/advancedQuery.ts`)

### 6.4 Weekly Journal Hierarchy

**Issue**: On DB graphs, weekly journals are saved as children of the year page

**Workaround**: Hierarchical search with `findDbWeeklyPageUuid()` (`src/lib/query/advancedQuery.ts`)

## 7. Test Results

| Graph Type | Logseq Version | Test Result | Notes |
|------------|---------------|-------------|-------|
| File graph | 0.10.x | ✅ Normal | Basic functions, calendar, navigation all working |
| DB graph | 2.x | ✅ Normal (after fix) | `pushState` format fix confirmed |

## 8. Logseq CLI and Command Invocation from Plugins

Logseq has a command-line interface (CLI) and APIs for invoking commands from plugins.

### 8.1 `invokeExternalCommand` API

`logseq.App.invokeExternalCommand()`, available as an official API in `@logseq/libs` 0.3.4, calls commands registered in Logseq's command palette programmatically.

**Signature**:
```typescript
logseq.App.invokeExternalCommand(
  type: ExternalCommandType,
  ...args: any[]
): Promise<void>
```

**Usage example**:
```typescript
// Open settings
await (logseq.App as any).invokeExternalCommand('settings')

// Open command palette
await (logseq.App as any).invokeExternalCommand('command-palette')
```

**Usage in this plugin**:
- Used in `src/lib/page_operations.ts` to open settings
- Called via `(logseq.App as any)` because it does not exist in type definitions

**Note**: `invokeExternalCommand` calls registered command types; it does not execute external processes.

### 8.2 `invokeExternalPlugin` API

`logseq.App.invokeExternalPlugin()` calls commands exposed by other plugins.

**Signature**:
```typescript
logseq.App.invokeExternalPlugin(
  type: string,
  ...args: any[]
): Promise<unknown>
```

**Usage example**:
```typescript
// Call a command exposed by another plugin
const result = await logseq.App.invokeExternalPlugin('some-plugin-command', arg1, arg2)
```

### 8.3 Logseq Official CLI (Node.js)

The Logseq main repository includes an official Node.js-based CLI in the `cli/` directory. This CLI allows graph operations, query execution, import/export, and more from the command line.

**Main features**:
- CRUD operations on pages/blocks
- Datascript query execution
- Graph import/export
- Server management (db-worker start/stop)
- Diagnostic tools (doctor)

**Documentation**: `docs/cli/logseq-cli.md` (in Logseq repository)

**Relationship with plugins**:
- The official CLI cannot be called directly from plugins
- `invokeExternalCommand` calls internal Logseq commands, which is different from CLI
- CLI is mainly for developers, used in CI/CD and batch processing

### 8.4 Third-Party Logseq CLI Tools

Several command-line tools have been developed by the community for operating Logseq graphs from the command line.

| Tool | Author | Language | Features |
|------|--------|----------|----------|
| [wolf-jonathan/logseq-cli](https://github.com/wolf-jonathan/logseq-cli) | wolf-jonathan | Python | NDJSON output, pipe support, combinable with jq |
| [muellerei/logseq-cli](https://github.com/muellerei/logseq-cli) | muellerei | Python | Dry-run mode, AI agent-friendly, safe writes |
| [cldwalker/logseq-query](https://github.com/cldwalker/logseq-query) | cldwalker | Node.js | Datalog queries only, EDN-based rule definitions |

**Characteristics of these tools**:
- Operate Logseq graphs directly (file-based)
- Independent from the plugin API
- Designed for batch processing and CI/CD
- `logseq-query` (`lq`) can be installed via npm: `npm install logseq-query -g`

### 8.5 Methods for Executing External Commands from Plugins

There are several ways to execute external processes from plugins:

#### Method 1: `invokeExternalCommand` (Recommended)
```typescript
// Call internal Logseq commands
await (logseq.App as any).invokeExternalCommand('settings')
```
- Can only call internal Logseq commands
- Safe and official API

#### Method 2: External Integration via `provideModel`
```typescript
logseq.provideModel({
  async handleExternalCall({ command, args }) {
    // External command execution logic
  }
})
```
- Plugin exposes a model that can be called by other plugins or external scripts
- External access via HTTP bridge is also possible

#### Method 3: Integration with External Scripts
```typescript
// Example of integration with Node.js scripts
// Plugin only prepares data, external script processes it
const data = await prepareData()
// Output data to clipboard or temporary file
// After processing with external tool, return results to plugin
```
- Logseq plugins run in a browser environment, so they cannot execute OS commands directly
- An intermediate layer (HTTP server or file I/O) is needed to integrate with external tools

### 8.6 Accessing Logseq API from Python

There are also ways to access Logseq's API from Python. Examples shared on Gists access Logseq's internal HTTP endpoints directly.

```python
# Example: Call Logseq API from Python
import requests

def raw_api_call(host, port, token, method, args):
    resp = requests.post(
        f'http://{host}:{port}/api',
        json={'method': method, 'args': args},
        headers={'Authorization': 'Bearer ' + token}
    )
    return resp.json()

# Example of calling logseq.App.pushState
raw_api_call('127.0.0.1', port, token, 'logseq.App.pushState', ['page', {'name': 'My Page'}])
```

**Note**: This method is unofficial and depends on Logseq's internal implementation. It may stop working in future versions.

## 9. Reference Links

- [Logseq Plugin API Documentation](https://logseq.github.io/plugins/modules.html)
- [Logseq GitHub Repository](https://github.com/logseq/logseq)
- [Logseq libs CHANGELOG](https://github.com/logseq/logseq/blob/master/libs/CHANGELOG.md)
- [DB Graph Specific Findings](./DB_GRAPH_FINDINGS.md)
- [Logseq CLI Documentation](https://github.com/logseq/logseq/blob/master/docs/cli/logseq-cli.md)
- [wolf-jonathan/logseq-cli](https://github.com/wolf-jonathan/logseq-cli) — Python CLI tool
- [cldwalker/logseq-query](https://github.com/cldwalker/logseq-query) — Node.js query tool
