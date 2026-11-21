name: Unzip project
on:
  workflow_dispatch:
permissions:
  contents: write
jobs:
  unzip:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          for z in singular-point.zip .github/singular-point.zip; do
            if [ -f "$z" ]; then unzip -oq "$z"; rm "$z"; fi
          done
          git config user.name "github-actions"
          git config user.email "actions@github.com"
          git add -A
          git commit -m "Unpack project" || exit 0
          git push
