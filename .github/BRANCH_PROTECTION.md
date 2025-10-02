# Branch Protection Rules

This document describes the branch protection rules that should be configured for the `main` branch to ensure code quality and prevent direct pushes.

## Required Configuration

To protect the `main` branch and ensure all changes go through pull requests that pass tests, configure the following settings in GitHub:

### Setting up Branch Protection Rules

1. Go to your repository on GitHub
2. Click on **Settings** → **Branches**
3. Under "Branch protection rules", click **Add rule**
4. Configure the following settings:

#### Branch name pattern
```
main
```

#### Protect matching branches

**Required settings:**

- ✅ **Require a pull request before merging**
  - ✅ Require approvals (recommended: at least 1)
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners (optional, if you have a CODEOWNERS file)

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Required status checks:**
    - `Run Tests` (from CI/CD Pipeline workflow)
    - `Build Application` (from CI/CD Pipeline workflow)
    - `All Checks Passed` (from CI/CD Pipeline workflow)

- ✅ **Require conversation resolution before merging**
  - Ensures all review comments are addressed

- ✅ **Require linear history** (optional but recommended)
  - Prevents merge commits and enforces rebase/squash

- ✅ **Do not allow bypassing the above settings**
  - Ensures even admins must follow the rules (recommended for team discipline)

**Optional but recommended settings:**

- ✅ **Require deployments to succeed before merging** (if using deployment automation)
- ✅ **Lock branch** - Temporarily disable pushes if needed for maintenance
- ⚠️ **Allow force pushes** - Keep disabled to prevent history rewriting
- ⚠️ **Allow deletions** - Keep disabled to prevent accidental deletion

## What This Means for Development Workflow

### Before Branch Protection
- Developers could push directly to `main`
- No guarantee that tests were run before code was merged
- Risk of broken builds in production

### After Branch Protection
1. All changes must be made on a feature branch
2. Create a pull request to merge into `main`
3. CI/CD pipeline automatically runs tests and builds
4. All required status checks must pass:
   - Tests must succeed
   - Build must succeed
   - All checks must pass
5. At least one code review approval required (if configured)
6. Once approved and all checks pass, the PR can be merged

### Developer Workflow

```bash
# 1. Create a feature branch from main
git checkout main
git pull origin main
git checkout -b feature/my-new-feature

# 2. Make your changes and commit
git add .
git commit -m "Add my new feature"

# 3. Push your branch to GitHub
git push origin feature/my-new-feature

# 4. Create a Pull Request on GitHub
# - Go to the repository on GitHub
# - Click "Compare & pull request"
# - Fill in the PR description
# - Submit the PR

# 5. Wait for CI/CD checks to pass
# - The workflow will automatically run tests and builds
# - Fix any failures by pushing new commits to your branch

# 6. Request review (if required)
# - Tag reviewers or wait for automatic review requests

# 7. Once approved and checks pass, merge the PR
# - Use "Squash and merge" or "Rebase and merge" for clean history
```

## Status Checks Explained

The CI/CD pipeline includes three main checks:

### 1. Run Tests
- Installs dependencies
- Runs all test suites for frontend and backend
- Runs linting (with warnings allowed)
- **Must pass** for PR to be mergeable

### 2. Build Application
- Installs dependencies
- Builds the frontend application
- Builds the backend application
- **Must pass** for PR to be mergeable

### 3. All Checks Passed
- Verifies that both test and build jobs succeeded
- Acts as a final gate before merging
- **Must pass** for PR to be mergeable

## Troubleshooting

### "Required status check is expected"
If you see this error, it means:
- The workflow hasn't run yet (push a commit to trigger it)
- The workflow is still running (wait for it to complete)
- The branch protection rule references a check that doesn't exist

### Checks failing
1. View the workflow run details on the "Checks" tab of your PR
2. Review the logs to identify the failure
3. Fix the issue in your branch
4. Push the fix - the checks will run automatically

### Need to bypass branch protection
In emergency situations, repository administrators can:
1. Temporarily disable branch protection
2. Push critical fixes
3. Re-enable branch protection immediately after

**Note:** This should be avoided except in true emergencies.

## Benefits

✅ **Code Quality**: All code is reviewed and tested before merging  
✅ **Stability**: `main` branch is always in a deployable state  
✅ **Collaboration**: Encourages code review and knowledge sharing  
✅ **Documentation**: PRs serve as documentation of changes  
✅ **Confidence**: Deploy to production knowing tests have passed  

## Related Documentation

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Status Checks Documentation](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [CI/CD Workflow](/.github/workflows/ci.yml)
- [Contributing Guide](/README.md#contributing)
