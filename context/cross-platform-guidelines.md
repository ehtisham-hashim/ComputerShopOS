# Cross-Platform Development & Windows Build Guidelines

> **Project:** PC Shop (Tauri 2 + React + Vite + TypeScript)  
> **Development OS:** Ubuntu (Linux)  
> **Target Production OS:** Windows (Client) & Linux / macOS  
> **Build Automation:** GitHub Actions (Windows Runner)

---

## 1. Core Principle: Zero Platform Lock-In

Because development is done on **Ubuntu** while the primary client runs on **Windows**, **no platform-specific assumptions or hardcoded behaviors are allowed**. 

What you develop and see on your Ubuntu dev server must work identically when compiled into a Windows `.exe` / `.msi` via GitHub Actions.

---

## 2. Path Handling & Filesystem Rules

### ❌ Never Do:
- **Never hardcode paths** like `/home/user/...`, `/tmp/...`, `~/.config/...`, or `C:\Users\...`.
- **Never use hardcoded slash concatenation** like `dir + "/" + filename` or `dir + "\\" + filename`.
- **Never assume case-insensitivity**. Linux is case-sensitive (`App.tsx` ≠ `app.tsx`), whereas Windows is case-insensitive. Always use exact casing for imports and file references so builds never break on either OS.

### ✅ Always Do:
- **Frontend (Tauri Path API):**
  Use `@tauri-apps/api/path` functions:
  ```typescript
  import { appDataDir, join, documentDir } from "@tauri-apps/api/path";

  // Resolves to correct OS directory automatically:
  // Windows: C:\Users\<User>\AppData\Roaming\com.tasnim.pc-shop\...
  // Linux:   /home/<user>/.local/share/com.tasnim.pc-shop/...
  const baseDir = await appDataDir();
  const filePath = await join(baseDir, "data", "database.json");
  ```
- **Backend (Rust):**
  Use `std::path::PathBuf` and Tauri path resolvers:
  ```rust
  use std::path::PathBuf;
  use tauri::Manager;

  // Let Tauri resolve OS-specific application data directory
  let app_data = app_handle.path().app_data_dir()?;
  let config_path = app_data.join("config.json");
  ```

---

## 3. WebView & Visual Consistency (Linux vs Windows)

| Feature | Ubuntu (Dev) | Windows (Client Production) |
| :--- | :--- | :--- |
| **Rendering Engine** | WebKitGTK (Safari/WebKit) | Microsoft Edge WebView2 (Chromium) |
| **Default System Font** | Ubuntu / DejaVu Sans | Segoe UI |
| **Scrollbars** | Thin overlay / GTK style | Standard Windows scrollbars |
| **Vite Build Target** | `safari13` | `chrome105` |

### To Ensure 100% Visual Consistency:
1. **Typography & Fonts:**
   - Do not rely on OS system fonts for UI text.
   - Use Google Fonts (e.g. Inter, Outfit, Plus Jakarta Sans) bundled via `@fontsource` or loaded via web fonts.
2. **Scrollbar Normalization:**
   - Custom-style scrollbars using modern CSS standards (`scrollbar-width: thin; scrollbar-color: ...`) to avoid bulky default Windows scrollbars:
     ```css
     * {
       scrollbar-width: thin;
       scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
     }
     ::-webkit-scrollbar {
       width: 6px;
       height: 6px;
     }
     ::-webkit-scrollbar-thumb {
       background: rgba(255, 255, 255, 0.2);
       border-radius: 9999px;
     }
     ```
3. **Inputs & Form Controls:**
   - Always apply `appearance: none;` on custom buttons, dropdowns, and inputs to avoid OS-native styling discrepancies.
4. **CSS Features:**
   - Use standard Flexbox and Grid.
   - Avoid experimental WebKit-only or Chromium-only CSS prefixes without fallbacks.

---

## 4. Shell Commands & Subprocesses

### ❌ Never Do:
- Do not execute bash/shell commands like `sh`, `bash`, `ls`, `grep`, `cat`, `chmod`, or `xdg-open`.
- Windows does not have these binaries natively and will fail with `CommandNotFound`.

### ✅ Always Do:
- Use Tauri plugins for native OS functionality:
  - Opening URLs/files in default app: `@tauri-apps/plugin-opener` (cross-platform).
  - Dialogs & File Pickers: `@tauri-apps/plugin-dialog`.
  - Notifications: `@tauri-apps/plugin-notification`.
  - Clipboard: `@tauri-apps/plugin-clipboard-manager`.
- If custom OS commands in Rust are required, branch conditionally using `#[cfg]`:
  ```rust
  #[cfg(target_os = "windows")]
  fn platform_specific_task() {
      // Windows-specific logic
  }

  #[cfg(target_os = "linux")]
  fn platform_specific_task() {
      // Linux-specific logic
  }
  ```

---

## 5. Line Endings & Git (`.gitattributes`)

* Windows uses `CRLF` (`\r\n`), Linux uses `LF` (`\n`).
* String splits on `\n` without handling `\r` can fail silently on Windows data.
* Regex matching lines should use `/\r?\n/` instead of `/\n/`.
* Ensure `.gitattributes` enforces standard checkout line endings.

---

## 6. GitHub Actions CI/CD (Windows Build Matrix)

To automate building and testing for Windows without needing a physical Windows machine, configure a GitHub Actions workflow targeting `windows-latest`.

### Recommended Workflow (`.github/workflows/release.yml`):
```yaml
name: Release App

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-tauri:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: 'windows-latest'
            args: ''
          - platform: 'ubuntu-22.04'
            args: ''

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies (Ubuntu only)
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

      - name: Setup Node.js & pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install frontend dependencies
        run: pnpm install --frozen-lockfile

      - name: Build Tauri App
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: v__VERSION__
          releaseName: 'App v__VERSION__'
          releaseBody: 'See the assets to download this version and install.'
          releaseDraft: true
          prerelease: false
```

---

## 7. Developer Checklist Before Pushing Code

- [ ] **No Absolute Paths**: All file paths use Tauri path APIs or relative paths.
- [ ] **Exact Case Sensitivity**: All TypeScript import paths match actual file names character-for-character.
- [ ] **No Native Linux Shell Commands**: File, network, and system actions use official Tauri plugins.
- [ ] **CSS Resets Applied**: Custom UI styling applied so inputs/scrollbars render identically on Chromium (Windows WebView2) and WebKit (Linux).
- [ ] **Clean Build Test**: `pnpm build` completes with 0 errors and 0 warnings before committing.
