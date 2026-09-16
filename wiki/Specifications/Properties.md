# Properties

The feature that will allow authors to set and manipulate global properties within a scenario, so that they can track and display progress information, and then use this for creating basic conditionals. This allows for a lot of added complexity within scenarios, and hence a more immersive simulation / game.

Some examples of what's possible with this system:

- A global health that is displayed on each scene
- A basic inventory system
- Delayed release of resources / information throughout progression
- (Extension) Conditional scene navigation based on a property requirement

## Creation

There will be two places where these properties can be managed within the authoring tool: 

- Globally for the whole scenario, where we can initialise the properties
- As a property on the button element, where we can define property transitions for that edge

To define property transitions, we'll use a simple dropdown based 'action' composition, which will hopefully make it easier for authors to use. Each action consists of 3 components:

- The property to change / transition
    - Limited to type of string, number (float), boolean and array
- The operation to do on that transition
    - Depending on the property type: set, increase, decrease, push, remove
- The value to provide to that operation

Composed actions would look something like this:

- *set intensity to super_intense*
- *increase health by 40*
- *push to inventory mac_10*

We want to limit the scope of what exactly is possible with this system to make it fairly easy to use while still allowing important transitions that make sense in this context.

## Storage

The properties should be available across both multiplayer and singleplayer scenarios. Within multiplayer, the properties will be shared among the group.

To make type validation easier, we store each property as an object with its name, type and initial value in an array within each scenario object.

However, at runtime we don't need type validation because we assume its already been validated on creation. Therefore the dynamic structure can just consist of a map, which will make operating on properties more efficient. The keys will correspond to the properties, other than an additional version key.

## Displaying

One of the key purposes of the properties is the display of them within the scenarios themselves. However we want to give granular control over what exactly is shown and how that looks. To achieve that, we need a system that makes it possible to encode the properties into the scenes themselves.

The easiest way to encode them is within the text inside the elements (speech boxes, text boxes).

### Format

A simple standard format for this is using dollar signs to wrap property placeholders. 

For example:

> John is really \$mood$ with you because you shot him \$no_shots$ times.

At runtime, the placeholders would get replaced with the actual property values. This would allow the basic display of properties, which is enough to serve most use cases.

In the future we can think about extending this to serve more complex use cases like conditionals.

### Pre-rendering

Since we want to retain the benefits provided by adopting an optimistic scene transition system, we'll need to do the pre-rendering on the frontend. This means we need to retain a local mirror of the properties that gets instantly updated on transitions, which then gets used to replace the property placeholders.

The (minor) drawback of this is that if validation fails (e.g. desync) then the user will see the updated properties for a short amount of time before the rollback, which could be used to cheat. I doubt anyone would go to the effort of making sense of that though.
Data Validation

We technically already support non traversing scene transitions, because a link button can link to the same scene its within. This behaviour was fine before, but now that a button can also have property transitions, we need to explicitly handle this to avoid property mismatches.

This means our transition validator (backend) needs to also check if the properties are the same, not just the scene. One way we can do this is by sending the full local properties alongside the navigation info to the navigation endpoint. However, a better way would be to generate and track a unique key that identifies a certain version of the properties, which we can use instead to validate.
