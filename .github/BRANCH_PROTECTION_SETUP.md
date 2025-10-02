# Branch Protection Setup Checklist

Use this checklist when configuring branch protection for the first time.

## Prerequisites
- [ ] Repository exists and has at least one commit on `main` branch
- [ ] CI/CD workflow has run at least once (to register status checks)
- [ ] You have admin access to the repository

## Setup Steps

### 1. Navigate to Branch Protection Settings
- [ ] Go to your repository on GitHub: https://github.com/gercamjr/family-recipes-app
- [ ] Click **Settings** tab
- [ ] Click **Branches** in the left sidebar
- [ ] Click **Add rule** button

### 2. Configure Branch Name Pattern
- [ ] Enter `main` in the "Branch name pattern" field

### 3. Enable Pull Request Requirements
- [ ] Check **Require a pull request before merging**
- [ ] Set "Required number of approvals before merging" to `1` (or more)
- [ ] Check **Dismiss stale pull request approvals when new commits are pushed**
- [ ] (Optional) Check **Require review from Code Owners**

### 4. Enable Status Check Requirements
- [ ] Check **Require status checks to pass before merging**
- [ ] Check **Require branches to be up to date before merging**
- [ ] In the status checks search box, add these three checks:
  - [ ] `Run Tests`
  - [ ] `Build Application`
  - [ ] `All Checks Passed`

> **Note:** If these status checks don't appear in the search box, you need to:
> 1. Make sure the CI/CD workflow has run at least once
> 2. Push a commit or create a test PR to trigger the workflow
> 3. Wait for the workflow to complete
> 4. Return to this settings page and the checks should appear

### 5. Additional Protection Settings
- [ ] Check **Require conversation resolution before merging**
- [ ] (Optional) Check **Require signed commits**
- [ ] (Optional) Check **Require linear history**
- [ ] Check **Do not allow bypassing the above settings** (recommended)
- [ ] Uncheck **Allow force pushes** (should be unchecked by default)
- [ ] Uncheck **Allow deletions** (should be unchecked by default)

### 6. Save Configuration
- [ ] Click **Create** button at the bottom of the page
- [ ] Verify the branch protection rule appears in the list

### 7. Test the Configuration
- [ ] Create a test branch: `git checkout -b test/branch-protection`
- [ ] Make a small change (e.g., add a comment to README.md)
- [ ] Commit and push: `git push origin test/branch-protection`
- [ ] Create a pull request on GitHub
- [ ] Verify that:
  - [ ] CI/CD checks run automatically
  - [ ] You cannot merge until checks pass
  - [ ] You cannot push directly to `main`
- [ ] Close the test PR without merging

### 8. Notify Team
- [ ] Inform team members about the new branch protection rules
- [ ] Share the [Branch Protection Guide](.github/BRANCH_PROTECTION.md)
- [ ] Share the updated [Contributing Guide](../README.md#contributing)

## Verification

To verify branch protection is working correctly:

```bash
# This should fail with "protected branch" error
git checkout main
git commit --allow-empty -m "test"
git push origin main
```

Expected output: `! [remote rejected] main -> main (protected branch hook declined)`

## Troubleshooting

### Status checks not appearing
- Wait for the CI/CD workflow to run at least once
- Create a test PR to trigger the workflow
- Refresh the branch protection settings page

### Cannot merge even after checks pass
- Verify all required status checks are configured correctly
- Check that the status check names match exactly (case-sensitive)
- Ensure the PR branch is up to date with `main`

### Need to bypass protection temporarily
Only in emergencies:
1. Temporarily uncheck "Do not allow bypassing the above settings"
2. Push your emergency fix
3. Immediately re-enable the protection

## Resources

- [Branch Protection Documentation](.github/BRANCH_PROTECTION.md)
- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [CI/CD Workflow](../.github/workflows/ci.yml)
