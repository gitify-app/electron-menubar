## Before opening issues

**If you are asking a question**:

Remember that `menubar` is just a lightweight wrapper around Electron. Most of the time you can probably find the answer to your question already answered in the [Electron Issue Tracker](https://github.com/electron/electron/issues)

**For bug reports/technical issues**:

Please provide the following information when opening issues:

- Which version of menubar are you using?
- What cli arguments are you passing?
- What platform are you running menubar on?
- Is there a stack trace in the error message you're seeing?
- If possible, please provide instructions to reproduce your problem.

Thanks!

## Releases

Releases are automated with [release-please](https://github.com/googleapis/release-please) and driven entirely from [Conventional Commits](https://www.conventionalcommits.org/) on `main`:

1. Merge PRs into `main` with Conventional Commit titles (`feat:`, `fix:`, `refactor:`, etc.). PR titles are validated in CI.
2. release-please opens and maintains a "release" PR that bumps the version in `package.json`, updates `CHANGELOG.md`, and proposes the next [semver](https://semver.org/) version.
3. Merge that release PR when ready. release-please then tags the release (`vX.Y.Z`) and creates the GitHub release.
4. The tagged release triggers the publish workflow, which builds the library and publishes it to npm with provenance.

No manual version bumping or `npm publish` is required.
