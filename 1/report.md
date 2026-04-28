# Task 1 Report

## Approach

I recreated the leaderboard as a static client-side web application inside the `1` folder so it can be deployed directly to GitHub Pages without a build step.

To match the source page, I first inspected the authenticated SharePoint leaderboard in the browser and reproduced the key UI and interaction model:

- SharePoint-like top navigation and site header
- page title and breadcrumb trail
- leaderboard heading and subtitle
- three filters: year, quarter, category
- employee search field
- top-3 podium layout
- ranked expandable list with recent activity tables

## Tools And Techniques

- GitHub Copilot in VS Code for implementation and iteration
- browser inspection through the IDE to read the rendered page structure and visible states
- prompt-driven generation followed by manual adjustment of layout, spacing, data model, and interactions
- plain HTML, CSS, and JavaScript to keep deployment simple on GitHub Pages

## Data Replacement

The original leaderboard contains real employee names, real photos, real titles, and real team identifiers. I replaced all of that with synthetic content:

- fictional employee names
- generated avatar initials instead of photos
- fictional titles and team codes
- synthetic activity names that preserve leaderboard semantics without copying internal data

I kept the leaderboard structure and category model intact so the UI behaves like the original while avoiding personal or internal corporate data.