# Contributing

This document provides guidelines for contributing to this project.

## Getting started

1. Fork or clone the repository
2. Install dependencies: `npm install`

## Development workflow

1. **Create a feature branch** from `main`
2. **Make your changes** following the [coding standards](#coding-standards)
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Run code checks**: `lint` and `test` (if available)
6. **Submit a pull request** with a clear description

## Coding standards

### Branch naming

Use descriptive branch names and follow [Conventional Branch](https://conventional-branch.github.io/) guidelines.

### Commit messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format

### Code checks

Repository has pre-commit code style and correctness checks. You can run them manually using `lint` and `format` scripts.

## Releases

To create a new release:

1. **Bump the version**: Run `npm version {patch|minor|major}` to update the version number in `package.json` and create a Git commit and tag

   - `patch`: Bug fixes (0.2.0 → 0.2.1)
   - `minor`: New features (0.2.0 → 0.3.0)
   - `major`: Breaking changes (0.2.0 → 1.0.0)

2. **Push changes**: Push the commit and tag to the repository:

   ```bash
   git push && git push --tags
   ```

3. **Create GitHub release**: Go to the [GitHub Releases](../../releases) page and:

   - Click "Create a new release"
   - Select the tag created in step 1
   - Add release notes describing the changes
   - Click "Publish release"

4. **Automatic npm publication**: Once the GitHub release is published, the package will be automatically published to npm via GitHub Actions workflow.

> **Note**: Make sure you have the `NPM_TOKEN` secret configured in your repository settings for the npm publication to work.
