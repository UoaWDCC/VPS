---
title: Dashboard
description: The dashboard is where scenario authors can view the progress of players assigned to that scenario, either individually or as groups.
layout: libdoc_page.liquid
eleventyNavigation:
  key: Dashboard
  parent: Getting Started
  order: 5
---

The dashboard allows you to analyse the overall flow of players through a scenario so that you can adjust it accordingly, or view the fine-grained progress of specific groups/players.

## Selecting a Playthrough

To select a specific playthrough to analyse, find the group in the groups table and select the **eye** at the end of the row. This will take you to the progress view for that specific group.

## Viewing the Progress

What you can see in the progress view for the group are the group's members, the tracked values, and the specific path for that group's playthrough. To navigate the **Scenario Overview** flowchart, use your cursor to pan and your scroll wheel to zoom. You can also rearrange the scenes to make certain sections easier to see. The grey paths represent unvisited paths, which are links between scenes that exist but haven't been used by this group. The green paths represent the links that this group has used. The multiplier represents the number of times that link has been travelled. The number at the top right of each scene represents the number of times that scene has been navigated to.

To make viewing the exact path the group took step by step easier, you can roll forward and back through the playthrough by using the **Next** and **Prev** buttons on the flow chart.

The [tracked values](/state/) in the **State Variables** section are the current values at this time. You can use these to check things like player score at the end of a playthrough, but also as an easier way to track the path. For example, instead of analysing the flowchart for every group to see if they visited a certain scene, you can use a tracked value like _has_visited_scene_x_, and look at this for every group.

## Exporting

Not yet implemented.
