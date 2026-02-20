# Timer

This is the feature that will allow authors to do two things: 

- Simulate the idea of "pressure" within a scene or group of scenes
- Provide deadlines for members of groups, or full groups, to have completed sections of the scenario by

These are inherently linked, because they require the same underlying logic but just have different consequences.

## Spec

A timer should be able to be set across three levels of specificity: a single scene, a path between two scenes, and a full scenario. In this way, an author can easily define any "critical paths" that require extra pressure.

### Single Scene

Here we want to time the period between entering the scene and navigating away from the scene. It's important that we explicitly check for a scene transition, as we want to keep the timer running when a button is just applying a state transition.

The use case of this is scenes that try to represent "split second decisions", where you want to challenge the quick thinking of the player. This is relevant to many contexts, not just medical simulations, and even some games lean into this functionality.

### Multi-Scene

Here we want to time the period between entering one scene and entering some other scene. We don't care about the specific path taken to traverse between these scenes, just that the player reaches the scene.

The use case of this is to represent a "critical section", which would either have only one solution / path or many solutions with a "critical path". Depending on the time given, this allows for good control over the strictness or intensity of the section.

### Global

Here want to time the full period from entering the first scene until entering the last scene. It is purely for convenience for the authors, since the same behaviour can be implemented using a multi-scene timer.

The use case here is a little bit different than the others, since we expect the players to play the scenarios through multiple disjointed periods of time across possibly multiple days. Therefore a tight period wouldn't make sense, and it becomes less of a matter of pressure and more of an administrative deadline.

## Multiplayer

To make sure the timer works correctly in multiplayer scenarios, we need to run the timer on the backend as well as the client. This way, we have a single source of truth that all of the client-side timers can base from. When any player loads in, their local timer will start based on the current value of the source timer.

Of course, since we optimistically update the frontend, this means that when some other player does move on before the timer ends, and we don't, we'll briefly see the consequences of timeout before being re-synced.

To avoid a situation like this, we can lock the scene(s) to a certain role, disabling multiplayer for the section.

## Consequences

When a timer ends, the author probably wants to perform some meaningful action. The most likely "actions" in this case are scene and state transitions. For example:

- *decrement health by 20*
- *set out_of_time to true*

The second one might seem useless, but it could be an important metric used by the author when reviewing the stats for players of the scenario. Especially if its used for grading an educational scenario.

Additionally, the author could set it to perform a state transition that either goes to the "default" link (which would usually be the worst option) and continues on, or a specific scene made to handle the timeout. One standard way to handle timeouts is to reset progress back to the start of the critical section.

### The Role Switch Action

Outside of just state and scene transitions, there's a specific action that was requested by the clients: role switching. As I said before, one approach in handling the critical sections is to lock them to certain roles, ensuring only one player is playing through the section at once. However, if the active player runs out of time, the role assigned to the scenes should switch to another one.

The general point of this is to avoid situations of negligence, ensuring that one person's failure doesn't stop the rest of the group from progressing. One other approach is to just perform a scene transition to the end of the critical section, which might work in some situations, but when there's important information within that section it robs the rest of the players from that knowledge.

Since the scene graph can get fairly complex, we need to validate a few things before we can allow this type of action:

- Every pathway should lead to either a dead end or the endpoint of the critical section
- Every scene within the section should only be assigned the same one role

This way, cycling between the roles is actually possible within the section. We can just traverse the graph from the start point and switch the role assigned to every scene we encounter. If we didn't do this validation, we might end up overwriting roles on scenes unrelated to the critical section, due to a mistake on the author's part.

The switching order should just cycle between the roles based on the definition order, aka the order they are stored in the scenario properties. Fine control over this order is unnecessary, and would introduce too much complexity.
