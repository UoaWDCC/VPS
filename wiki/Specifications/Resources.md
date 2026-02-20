# Resources

The feature that will allow authors to upload a range of different files that they can then show to the users at different points throughout the scenario depending on certain conditions. The dynamic nature of this feature will rely on [State Variables](./State%20Variables.md), which will allow fairly complex visibility management.

## Spec

There are two levels to the resources, the folder level and the file level. The author should be able to create, rename and add visibility conditions to both folders and files. In this way, authors can basically organise the resources, simplifying the interface for the players. It is basically a simple 2-level file system.

### Files

We want to support multiple file types that cover the base range of formats a scenario might benefit from. This list will probably evolve over time, but for release we want at least these:

- PDF 
- Text
- Markdown
- Image (PNG, JPG)

This should cover the basics needs of richtext and images.

#### Rendering

We'll need at least 2 renderers to support these files, one for pdf and one for markdown. Since markdown is a richtext format, it inherently supports standard text (i.e. from .txt files) as well.

### Folders

Folders are containers for our resources for organisational purposes, and can act as a way to "bundle" resources for conditional visibility. For example, we might group multiple scan images together into a scan folder, and then show this folder when the scan is performed.

### Conditionals

The visibility conditionals operate on our [State Variables](./State%20Variables.md), and will likewise be limited in scope to make authoring as simple as possible for unfamiliar users. We'll use the same compositional approach we use to manage the state, where instead of an operation we have a comparison:

- Equal to
- Greater than
- Less than
- Contains

Additionally, we'll have a fourth component before the comparison to toggle negation. This would just behave as a toggle represented by 2 options: is and is not.

Composed conditionals would look something like this:

- *health is greater than 40*
- *intensity is not equal to super_intense*
- *inventory is contains mac_10*

## Data Validation

There are two approaches we can use for handling resources data:

- Parse the conditionals on the backend with every state transition, and return only the visible resources alongside the scene data
    - This ensures that the client never receives information the player isn't supposed to have
    - However it means we have to do more processing on the server and data might take longer to send
- Parse the conditionals on the client with every state transition
    - This means we'll have to fetch all of the resource objects on scenario load

Although doing the parsing client side opens up the possibility of cheating, I think it's worth it given the resource tree will likely be a small object, so continuously sending it is overkill and unnecessary.

One important consideration for this approach is to ensure that we only parse the conditionals on validated state data, otherwise we might end up parsing it twice when a desync occurs.
