# Investigator Kit

Portable AI investigation system for production incident root-cause analysis.

## Install

```powershell
npx @mahmoudelderby/investigator-kit init --cursor
# or
npx @mahmoudelderby/investigator-kit init --claude
```

Without flags, the CLI prompts you to choose a host (no auto-detection).

After install:

```
Installed. Open your agent and run the 'investigator-init' skill to adapt it to this project.
```

## Documentation

- [Kit overview](docs/README.md)
- [Validation quickstart](specs/001-investigator-kit/quickstart.md)
- [Design brief](BRIEF.md)

## Development

```powershell
cd installer
npm install
npm test
```

## License

MIT
