# Git Conventions

## Branches

Create a branch for your issue and name the branch `VPS-[issue no.]/[issue name]` (if the issue name is long, a shorter version is also fine)

- e.g. `VPS-007/add_labels_in_toolbar`

### Merging

When working on branches, we want to favor **rebasing** over creating merge commits. Rebasing maintains a cleaner, linear commit history, making it easier to review changes and understand the progression of the codebase. Its also helpful to rebase often when new commits are being pushed to main, so that any conflicts are smaller and easier to resolve.

## Commit Messages

The project follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for commit messages and descriptions, which is a loose specification that allows for rapid development while making sure commits are thought out and purposeful.

## Pull requests

Once you've made all your commits, open a PR with the same name as the branch `(VPS-[issue no.]/[issue name])` and fill in the details of the template. If you want to look at it the PR template can be found [here](https://github.com/UoaWDCC/VPS/blob/).

After the PR passes the validation pipeline (format and linting) and passes the required no. of approvals (should be 2), you can merge the PR preferably using either **squash and merge** or **rebase and merge** so that the commit history stays clean and unpolluted by merge commits.

Make sure you delete the branch after you merge the PR, it’s not a good idea to re-use branches after their changes have been merged as it could easily lead to conflicts if you’re not careful. We also don’t want stale branches lying around.
