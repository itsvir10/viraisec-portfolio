---
title: Building a Wazuh SIEM home lab
date: 2026-07-23
summary: A working SIEM on my own machine, with a Kali Linux manager, a Windows 11 agent, and one version mismatch that taught me to read logs properly.
tags: [Wazuh, SIEM, FIM, Kali Linux, Windows 11, VirtualBox, Log Analysis]
field: security
repo: https://github.com/itsvir10/wazuh-siem-lab
---

<!-- DRAFT: "What I learned" was written for you from what you have said about this project. Rewrite it in your own words before publishing. -->

## Summary

I built a small security operations setup at home: a Wazuh manager on Kali Linux watching a Windows 11 endpoint, both running in VirtualBox. File Integrity Monitoring on the Windows machine raises an alert whenever a watched file changes. Partway through, the agent refused to connect because its version did not match the manager's, and I traced the cause through the logs and fixed it.

## What I learned

- A SIEM is only as good as what it is told to watch. Choosing which files and paths to monitor mattered more than the install itself.
- The logs tell you what is wrong if you actually read them. The version mismatch looked like a network problem until the agent and manager logs said otherwise.
- Agent and manager versions have to line up. Pinning versions is now the first thing I check in any lab.
- Building it myself made SIEM concepts like agents, rules and alerts concrete in a way that reading about them never did.

## Setup and steps

The full build, configuration and the debugging write-up are on GitHub: [itsvir10/wazuh-siem-lab](https://github.com/itsvir10/wazuh-siem-lab)
