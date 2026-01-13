---
sidebar: false
outline: [2, 3]
---

# Element Ai Vue Contribution Guide

Hi! Thank you sincerely for choosing **Element Ai Vue**.

**Element Ai Vue** is a component library designed for quickly building AI chat scenarios. Developed in depth based on Vue 3, it fully meets the requirements of projects for high customization.

Every iteration and improvement of **Element Ai Vue** cannot be separated from the support of the community. If you are willing to contribute code or put forward valuable suggestions, please read the following guide carefully.

## Issue Submission Guidelines

To ensure the efficiency of issue handling, please follow these rules:

- **Bug and Feature Only**: The issue tracking system is exclusively for submitting bug reports, feature requests, and design-related discussions. Other types of inquiries may be closed directly.

- **Avoid Duplicates**: Before submitting an issue, please search the historical issues to confirm whether the relevant content has already been raised.
- **Provide Detailed Information**:
  - Please be sure to specify the exact version numbers of **Element Ai Vue** and Vue.
  - Provide information about the operating system and browser version.

## Pull Request (PR) Guidelines

We welcome code contributions in any form, but please note the following points before submitting a PR:

### 1. Branch Management

- **Fork the Project**: Please fork the repository to your personal account first; do not create branches directly in the main repository.
- **Target Branch**: Ensure that your PR is submitted to the `dev` branch. **Never** submit directly to the `master` branch.
- **Sync with Upstream**: Keep your code in sync with the upstream repository, and maintain clean commit history.

### 2. Commit Guidelines

Commit messages must strictly follow the `type: description` format (Angular convention), e.g., `fix: [scrollbar] fix xxx bug`.

- **Header**: Keep the length within 72 characters.
- **Type (Must Be One of the Following)**:
  - `feat`: New feature
  - `fix`: Bug fix
  - `docs`: Documentation changes
  - `style`: Code format adjustments (no impact on logic)
  - `refactor`: Code refactoring (neither new features nor bug fixes)
  - `perf`: Performance optimization
  - `test`: Test-related changes
  - `build`: Changes to the build system or external dependencies
  - `ci`: CI configuration changes
  - `chore`: Other miscellaneous changes
  - `revert`: Revert a previous commit
  - `release`: Version release
  - `improvement`: Functionality improvement

### 3. Build and Files

- **Do Not Submit Built Artifacts**: Please do not submit the bundled files in the `lib` directory.
- **Local Build Check**: Before submission, run `npm run build` locally to ensure the project can be compiled and bundled successfully.

### 4. Description and Review

- **PR Description**: If it is a bug fix, please describe the content and reason of the fix in detail in the PR.
- **Code Review**: Code merging requires strict review — it needs to be reviewed and approved by one maintainer, then reviewed again by another maintainer before it can be merged.
