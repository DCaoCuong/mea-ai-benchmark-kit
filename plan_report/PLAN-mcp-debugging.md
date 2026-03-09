# PLAN: MCP & Browser Debugging Practice

**Goal**: Cấu hình MCP để Antigravity kết nối với MEA project (GitHub + Supabase)  
**Level**: Beginner → Intermediate  
**Duration**: 2 ngày (16 hours)  
**Starting Point**: Zero MCP experience

---

## 📚 Day 1: MCP Fundamentals & Setup (8h)

### Module 1.1: MCP Concepts (1h) ✅
- [x] **What is MCP?** - Model Context Protocol overview
- [x] **Architecture**: Host ↔ Client ↔ Server
- [x] **Core Primitives**: Resources, Tools, Prompts
- [x] **Transport Types**: stdio, SSE, HTTP

**Key Reading**: [MCP Specification](https://modelcontextprotocol.io/specification)

### Module 1.2: Environment Setup (2h) ✅
- [x] Verify Node.js 18+ installed (v22.18.0)
- [x] Install MCP Inspector: `npx @modelcontextprotocol/inspector`
- [x] Locate Antigravity MCP config: `C:\Users\CgPC\.gemini\antigravity\mcp_config.json`
- [x] Package đúng: `@modelcontextprotocol/server-filesystem`
- [x] Test MCP Inspector connection ✅

**Lesson Learned**: Packages dưới `@modelcontextprotocol/`, không phải `@anthropic/`

### Module 1.3: Built-in MCP Servers (2h) ✅
- [x] Configure `@modelcontextprotocol/server-filesystem` for MEA
- [x] Test MCP filesystem qua Antigravity ✅
- [x] Thấy "MCP Tool: filesystem / list_directory" hoạt động
- [x] Thực hành: Explore MEA codebase qua MCP

**Exercise**: Query MEA source files qua MCP

### Module 1.4: GitHub MCP Server (3h)
- [ ] Install/configure GitHub MCP server
- [ ] Create GitHub Personal Access Token
- [ ] Connect to MEA repos
- [ ] Test: List commits, read files, search code
- [ ] Debug với browser DevTools

**Exercise**: Fetch latest commits từ MEA-BE và MEA-FE repos

---

## 🛠️ Day 2: Supabase MCP & Custom Server (8h)

### Module 2.1: Supabase MCP Server (3h)
- [ ] Research Supabase MCP options
- [ ] Configure database connection
- [ ] Test: Query patients, sessions, bookings
- [ ] Secure credentials với env vars
- [ ] Debug query issues

**Exercise**: Query dashboard stats qua MCP

### Module 2.2: Build Custom MCP Server (3h)
- [ ] Setup TypeScript MCP server boilerplate
- [ ] Create MEA-specific tools:
  - `get-patient-stats` - Dashboard data
  - `search-sessions` - Find examination sessions
  - `analyze-comparison` - AI vs Doctor metrics
- [ ] Register với Antigravity
- [ ] Test custom tools

**Exercise**: Build `mea-mcp-server` package

### Module 2.3: Browser Debugging Deep Dive (2h)
- [ ] MCP Inspector usage
- [ ] Chrome DevTools for MCP
- [ ] Common error patterns
- [ ] Performance monitoring
- [ ] Troubleshooting checklist

**Exercise**: Debug simulated MCP failures

---

## 🎯 Learning Outcomes

Sau 2 ngày, bạn sẽ:
1. ✅ Hiểu MCP architecture và concepts
2. ✅ Kết nối Antigravity → MEA codebase (filesystem)
3. ✅ Kết nối Antigravity → GitHub repos
4. ✅ Kết nối Antigravity → Supabase database
5. ✅ Build custom MCP server cho MEA
6. ✅ Debug MCP issues với browser tools

---

## 📂 Files to Create

| File | Purpose |
|------|---------|
| `mcp-config.json` | Antigravity MCP configuration |
| `mea-mcp-server/` | Custom MCP server for MEA |
| `docs/MCP-SETUP.md` | Configuration documentation |

---

## 🚀 Ready to Start?

Bắt đầu với **Module 1.1** ngay bây giờ?
