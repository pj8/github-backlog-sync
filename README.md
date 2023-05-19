# GitHub-Backlog Sync Action
## Description

- This GitHub Action synchronizes GitHub pull requests with Backlog issues.
- It scans the body of a pull request for Backlog issue URLs and automatically adds the pull request URL to a designated custom field in the corresponding Backlog issue.
- This action is particularly useful for teams using Backlog for project management and GitHub for source control, helping to streamline the process of tracking pull requests associated with specific Backlog issues.

# Inputs

- `BACKLOG_API_KEY`: Your Backlog API key. This is required.
- `BACKLOG_SPACE_NAME`: Your Backlog space name. This is required.
- `BACKLOG_PROJECT_KEY`: Your Backlog project key. This is required.
- `BACKLOG_CUSTOM_FIELD_ID`: The ID of the Backlog custom field where the GitHub pull request URLs will be added. This is required.

# Example
```yaml
name: GitHub-Backlog Sync

on:
  pull_request:
    types: [opened, edited]

jobs:
  sync:
    runs-on: ubuntu-latest

    steps:
    - name: GitHub-Backlog Sync Action
      uses: pj8/github-backlog-sync@v1.2.8
      with:
        BACKLOG_API_KEY: ${{ secrets.BACKLOG_API_KEY }}
        BACKLOG_SPACE_NAME: "your_space_name"
        BACKLOG_PROJECT_KEY: "your_project_key"
        BACKLOG_CUSTOM_FIELD_ID: your_custom_field_id
```
