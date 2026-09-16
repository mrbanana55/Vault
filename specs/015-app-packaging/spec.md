# Feature Specification: Desktop Application Packaging for macOS and Windows

**Feature Branch**: `015-app-packaging`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "Let's create the app's packaging. I want to have both windows and MacOS packages for sharing my app"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Package and Distribute for macOS (Priority: P1)

Musicians and collaborators who use macOS need an easy-to-install package of Vault so they can install and run the application on their Macs without installing developer tools, terminal environments, or external dependencies. The distributor generates a standard macOS disk image (`.dmg`) and archive (`.zip`). When a Mac user opens the disk image, they see a familiar drag-and-drop installer window presenting the Vault application icon alongside a shortcut to the system Applications folder. Dragging the icon installs Vault immediately. Upon launching, Vault opens into the full catalog interface with complete offline access to audio recording, audio playback, file importing, and persistent database storage.

**Why this priority**: Essential requirement for sharing the application with macOS users. The application must run completely standalone from a standard macOS installer bundle.

**Independent Test**: Can be tested by building the macOS distribution package, opening the resulting `.dmg` file on a clean macOS system, dragging Vault into the Applications folder, launching the installed app with all development servers stopped, and confirming that audio recording, playback, and database persistence operate flawlessly.

**Acceptance Scenarios**:

1. **Given** a generated macOS distribution package (`.dmg`), **When** the recipient double-clicks the file, **Then** the disk image mounts and presents a visual window showing the Vault application icon and an Applications folder destination shortcut.
2. **Given** the mounted disk image, **When** the user drags the Vault icon into the Applications shortcut, **Then** the application is copied to `/Applications` with all required resources and native binaries intact.
3. **Given** Vault is installed in Applications, **When** the user launches the application, **Then** the main window opens with the branded Vault icon in the macOS Dock, loading the user interface instantly without requiring any developer tools or command-line commands.
4. **Given** the packaged application is running, **When** the user records an idea or imports an audio file, **Then** the audio is saved to the user's persistent local storage and cataloged in the local database.
5. **Given** an existing installation of Vault with saved audio notes, **When** the user installs an updated version of the application package, **Then** all previously recorded audio files and catalog metadata remain intact and accessible.

---

### User Story 2 - Package and Distribute for Windows (Priority: P1)

Musicians and collaborators who use Windows need an installer package for Vault so they can install, launch, and use the application on Windows 10 and 11 PCs. The distributor generates a standard Windows installer (`.exe`) and optional portable executable. When a Windows user runs the installer, an installation wizard guides them through installing Vault into their local user directory without requiring administrator privileges, creates a desktop shortcut and a Start Menu entry, and opens the application upon completion. The user can also cleanly uninstall Vault at any time via the standard Windows Add/Remove Programs control panel.

**Why this priority**: Essential requirement for sharing the application with Windows users. Cross-platform sharing requires Windows-native installation and desktop integration.

**Independent Test**: Can be tested by building the Windows distribution package, running the installer on a Windows machine, launching Vault from the desktop shortcut with no development environment present, verifying that audio playback, recording, and database storage function normally, and verifying that the uninstaller removes application binaries cleanly.

**Acceptance Scenarios**:

1. **Given** a generated Windows installer package (`.exe`), **When** the user double-clicks the installer, **Then** a setup wizard appears displaying the Vault application name, version, and installation options.
2. **Given** the setup wizard, **When** the user proceeds through the default installation flow, **Then** Vault is installed to the user's application directory and creates shortcuts in the Start Menu and on the Desktop.
3. **Given** the installation completes, **When** the user launches Vault from the Desktop or Start Menu shortcut, **Then** the application starts cleanly, displaying the branded Vault icon in the Windows Taskbar and window frame.
4. **Given** the packaged Windows application is running, **When** the user records an audio idea or imports audio files, **Then** the audio and database entries are stored securely in the user's Windows AppData directory.
5. **Given** Vault is installed on Windows, **When** the user chooses to uninstall Vault from the Windows Settings/Control Panel, **Then** the application binaries and shortcuts are cleanly removed.

---

### User Story 3 - Application Identity, Branding, and Visual Assets (Priority: P2)

When users receive and install Vault, they need the application to present a polished, cohesive visual identity that distinguishes Vault on their operating system. The application bundle must include high-resolution platform-specific icons (`.icns` for macOS, `.ico` for Windows) and accurate application metadata (Product Name "Vault", Version, Executable Name, Bundle Identifier, and Copyright). The branded icon appears in file managers, installer windows, task switchers, the macOS Dock, and the Windows Taskbar.

**Why this priority**: A professional desktop application must not show generic placeholder icons or default Electron branding. Branded assets build user trust and ensure recognition across the desktop environment.

**Independent Test**: Can be tested by inspecting the packaged binaries and installer files on both operating systems to confirm that the Vault icon renders sharply at all standard icon sizes (16x16 up to 512x512 on Windows, and up to 1024x1024 Retina on macOS) without pixelation or placeholder graphics.

**Acceptance Scenarios**:

1. **Given** the packaged application on macOS, **When** viewed in the Finder, Dock, Application Switcher (Cmd+Tab), and About dialog, **Then** the high-resolution Vault icon is displayed crisply.
2. **Given** the packaged application on Windows, **When** viewed in File Explorer, the Taskbar, Alt+Tab switcher, and Desktop shortcuts, **Then** the high-resolution Vault icon is displayed crisply.
3. **Given** the application metadata on either platform, **When** inspecting file properties or system information, **Then** the application name is "Vault", the version matches the current project version, and the bundle identifier is uniquely defined.

---

### User Story 4 - Automated Multi-Platform Packaging Commands (Priority: P2)

The application developer needs automated, reliable packaging commands in the project configuration so they can build distribution packages for macOS and Windows repeatedly and consistently without manual file copying or ad-hoc bundling steps. Executing a packaging command compiles production assets, compiles/bundles native modules for the target platform, packages the application, and deposits ready-to-share distributables into an output folder.

**Why this priority**: Manual packaging is error-prone, particularly with native binary modules (`better-sqlite3`). Automated packaging scripts ensure reproducible builds and easy preparation of release artifacts.

**Independent Test**: Can be tested by running the packaging command from a clean repository state and verifying that the build pipeline executes without manual intervention, producing valid installer files in the designated output directory.

**Acceptance Scenarios**:

1. **Given** a developer terminal in the project directory, **When** executing the platform packaging command, **Then** the build system automatically compiles the main process, compiles the renderer assets for production, packages the application, and places output installers in a dedicated distribution directory.
2. **Given** the packaging process runs, **When** packaging completes, **Then** terminal output summarizes the generated file names, file sizes, and destination paths.
3. **Given** an invalid or failing build step, **When** an error occurs during packaging, **Then** the command exits with an informative error message indicating the specific cause of failure.

---

### Edge Cases

- **Standalone Launch Without Local Dev Server**: The packaged application must load static production assets directly from internal app resources and must never attempt to connect to a local development server (`http://localhost:5173`).
- **Native C++ Module Compatibility (`better-sqlite3`)**: The packaged app must include native database binaries compiled specifically for the target operating system, platform architecture, and runtime ABI version so the app does not crash with missing module or version mismatch errors on recipient machines.
- **Unsigned Distribution Warnings (Gatekeeper & SmartScreen)**: Because the app may initially be distributed without paid commercial code signing certificates, macOS Gatekeeper and Windows SmartScreen will display standard security prompts for downloaded applications. The packaging documentation must provide clear, concise instructions for recipients to open unsigned applications (e.g., macOS "Right-click -> Open" or Terminal quarantine release; Windows "More info -> Run anyway").
- **Preservation of User Data During App Upgrades**: Installing an updated package over an existing version must never delete or overwrite the user's existing SQLite database (`vault.db`) or physical audio files in the application's user data directory.
- **Microphone and Audio Hardware Permissions**: On macOS and Windows, running the packaged standalone application must trigger standard operating system microphone access permission prompts when recording is first initiated, gracefully handling permission denial without crashing.
- **Cross-Compilation Constraints**: Compiling native C++ modules for Windows from a macOS host can encounter toolchain limitations. The packaging architecture must support building for the host platform and provide a reproducible path (such as a multi-platform CI matrix or documented build commands) for producing the Windows packages.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The build system MUST provide automated commands to generate production distribution packages for macOS.
- **FR-002**: The build system MUST provide automated commands to generate production distribution packages for Windows.
- **FR-003**: The macOS packaging output MUST include an Apple Disk Image (`.dmg`) installer featuring a drag-and-drop install interface with an Applications folder shortcut.
- **FR-004**: The macOS packaging output MUST support Apple Silicon (`arm64`) architecture and Intel (`x64`) architecture, either as separate packages or as a universal package.
- **FR-005**: The Windows packaging output MUST include a standard executable installer (`.exe`) that installs the application to the user's profile directory without requiring administrator privileges.
- **FR-006**: The Windows installer MUST provide options to create a Desktop shortcut and a Start Menu shortcut.
- **FR-007**: The Windows installer MUST register an uninstaller in Windows Settings / Add or Remove Programs that cleanly removes installed application binaries.
- **FR-008**: The packaged application MUST bundle all compiled main process code, preload scripts, renderer web assets, and static files so it runs 100% offline and standalone without requiring Node.js or any developer tools on the host system.
- **FR-009**: The packaged application MUST bundle the native `better-sqlite3` binary compiled for the target platform and runtime ABI, ensuring database operations initialize without runtime errors.
- **FR-010**: In packaged production mode, the application MUST load the bundled user interface from local files and MUST NOT attempt to load from local development server URLs.
- **FR-011**: The packaged application MUST persist all user data, including the SQLite database and audio vault directory, inside the operating system's standard user data directory (`userData`), ensuring user data persists across application updates and reinstallations.
- **FR-012**: The application package MUST embed dedicated, branded high-resolution icon assets in platform-appropriate formats (`.icns` for macOS, `.ico` for Windows).
- **FR-013**: The application package MUST define cohesive application metadata, including Product Name ("Vault"), Executable Name ("Vault"), Application ID (`com.vault.app`), and semantic version number matching the project configuration.
- **FR-014**: All generated distribution packages and installers MUST be placed into a clean, dedicated output directory (e.g., `release/` or `dist-packages/`) that is excluded from version control.
- **FR-015**: The packaging configuration MUST support optional code signing and notarization parameters so certificates can be supplied via environment variables when available without breaking unsigned builds.
- **FR-016**: The distribution package MUST prompt for operating system audio/microphone permissions when audio recording is invoked, handling permission grants and denials gracefully.

---

### Key Entities *(include if feature involves data)*

- **Distribution Package**: A standalone, platform-specific installable artifact (macOS `.dmg` / `.zip`, Windows `.exe` installer / portable executable) that bundles the application runtime, compiled code, assets, and native dependencies for distribution to end users.
- **Application Identity Profile**: A configuration record containing the application's unique identity parameters (Product Name, Executable Name, Application ID, Version Number, Author/Publisher, Description, Copyright).
- **Platform Icon Assets**: A structured collection of multi-resolution graphic assets formatted as `.icns` (macOS 16x16 through 1024x1024) and `.ico` (Windows 16x16 through 256x256) used by the operating system shell, desktop, and window manager.
- **Target Platform Configuration**: Specification of operating system target, architecture (`x64`, `arm64`, `universal`), installer type (`dmg`, `nsis`, `portable`, `zip`), and artifact naming templates.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users on macOS and Windows can install and launch the packaged application on a machine without Node.js, git, or developer tools installed in under 60 seconds.
- **SC-002**: 100% of core application features (audio recording, playback, audio file import, metadata editing, search/filter, and theme toggling) function identically in the packaged application as in the development environment.
- **SC-003**: The packaged application displays crisp, high-resolution branding icons across all standard OS surfaces (macOS Dock, Windows Taskbar, desktop shortcuts, and installer dialogs) with zero fallback placeholder icons.
- **SC-004**: Packaging commands produce ready-to-share installer files in under 5 minutes on standard modern desktop hardware.
- **SC-005**: Installing an updated package over an existing installation retains 100% of previously recorded audio files and database entries with zero data loss.
- **SC-006**: The Windows uninstaller removes 100% of application binaries, shortcuts, and registry entries created during installation.

---

## Assumptions

- **Distribution Method**: Initial distribution is direct sharing (e.g. sharing installer files via cloud storage links, direct file transfers, or repository release downloads) rather than commercial app stores (Mac App Store, Microsoft Store).
- **Code Signing**: Official paid certificates (Apple Developer Program ID with Apple Notarization, and Windows EV / Trusted Signing certificates) are optional and assumed unconfigured for initial sharing. Packaging will produce functional unsigned binaries, with clear documentation provided for end users on handling OS security prompts (macOS Gatekeeper "Open Anyway" or quarantine attribute clearing; Windows SmartScreen "Run anyway"). The packaging setup will be structured to accept signing credentials seamlessly whenever acquired.
- **Target Operating System Versions**: Packaging targets modern, currently supported desktop versions: macOS 11 (Big Sur) or newer, and Windows 10/11 (64-bit).
- **Architectures**: macOS packages will target Apple Silicon (`arm64`) and Intel (`x64`). Windows packages will target 64-bit Intel/AMD (`x64`).
- **Icon Source**: If a custom multi-format icon file is not yet committed to the repository, a clean, high-resolution Vault icon will be established and converted into required `.icns` and `.ico` formats during implementation.
- **Multi-Platform Build Strategy**: Native C++ modules (`better-sqlite3`) must match the host target. The project will provide direct commands to package on the local host OS, and support a unified multi-platform packaging workflow (e.g., via GitHub Actions CI matrix or cross-platform toolchains) to generate both macOS and Windows packages cleanly.
