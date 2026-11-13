---
title: An AI agent that job-hunts for me
date: 2026-11-12
summary: A Claude skill plus Firecrawl that searches for internships every week and checks each one against my tracker, so I do not have to.
tags: [Claude, AI Agents, Firecrawl, Workflow Automation]
field: ai
repo: https://github.com/itsvir10
---

<!-- DRAFT: "What I learned" was written for you from what you have said about this project. Rewrite it in your own words, and swap the repo link above and below for this project's own repo once it is on GitHub. -->

## Summary

Searching for internships by hand meant checking the same job boards every week and re-reading roles I had already ruled out. So I built an agent for it: a Claude skill that uses Firecrawl to find and read internship listings, runs on a weekly schedule, and checks every role against my application tracker before anything reaches me.

## What I learned

- Agents need clear rules more than clever prompts. Spelling out exactly what counts as a match did more than any amount of wording.
- Job-board listings are not the full story. Checking requirements on the employer's own site is the step that catches roles I am not eligible for.
- Giving the agent a memory (the tracker) is what stopped it from repeating itself every week.
- Scheduling turned a tool I had to remember to run into one that just works in the background.

## Setup and steps

The code and setup are on GitHub: [github.com/itsvir10](https://github.com/itsvir10)
