# Packaging and Testing

## Prerequisites

- Node.js 18 or newer
- The `zip` command available on the system path

## Commands

Run tests:

```bash
npm test
```

Remove generated artifacts:

```bash
npm run clean
```

Build the Thunderbird package:

```bash
npm run build
```

The build script creates a versioned `.xpi` file inside `dist/`.

## Packaging Details

The packaging script:

1. Reads the extension version from `manifest.json`.
2. Ensures the `dist/` output directory exists.
3. Uses the system `zip` tool to package `manifest.json` and the full `src/`
   directory into a Thunderbird-compatible `.xpi` archive.

## Test Coverage

The included unit tests cover:

- configuration validation and sanitization
- menu definition generation
- PDF attachment detection
- forward-and-archive success flow
- archive-only fallback when the PDF requirement is not met
- failure handling that prevents archiving when send fails
