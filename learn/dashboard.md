---
layout: base.njk
---

# Dashboard

The dashboard is how scenario authors can view the progress of players that have been assigned to that scenario, either individually or as groups. This allows you to analyse the general flow of players through scenarios so that you can adjust them accordingly, or view the fine grained progress of specific groups / players.

## Selecting a Playthrough

To select a specific playthrough to analyse, find the group in the groups table and select the **eye** at the end of the row. This will take you to the progress view for that specific group.

## Viewing the Progress

What you can see in the progress view for the group are the members of the group, the tracked values and the specific path for that group's playthrough. To navigate the **Scenario Overview** flowchart, use your cursor to pan and your scroll wheel to zoom. You can also move the scenes around to make viewing certain sections clearer. The grey paths represent unvisited paths, which are links between scenes that exist but haven't been used by this group. The green paths represent the links that this group has used. The multiplier represents the number of times that link has been travelled. The number at the top right of each scene represents the number of times that scene has been navigated to.

To make viewing the exact path the group took step by step easier, you can roll forward and back through the playthrough by using the **Next** and **Prev** buttons on the flow chart.

The [tracked values](/editor/#tracked-values) under the **State Variables** section are the current values at this point in time. You can use these to check things like player score at the end of a playthorugh, but also as an easier way to track the path. For example, instead of analysing the flowchart for every group to see if they visited a certain scene, you can use a tracked value like _has_visited_scene_x_, and just look at this for every group.

## Exporting

Not yet implemented.
