# Conditional Destinations

A button can lead to different scenes depending on the player's properties. For example, **Next** goes to "Deteriorates" if `heartRate > 120`, otherwise to "Stable".

## Data

On a clickable component, next to `nextScene`:

```json
{
  "nextScene": "<sceneId>",
  "nextSceneRules": [
    { "stateVariableId": "<propertyId>", "comparator": ">", "value": 120, "sceneId": "<sceneId>" }
  ]
}
```

- `nextSceneRules` is checked **in order** and the **first match wins**.
- `nextScene` is the **fallback**, used when no rule matches. Without one the player stays on the scene.
- `comparator` is `=`, `!=`, `>` or `<`. Text and true/false properties only allow `=` and `!=`.
- Nothing about the scene schema changes: components are stored as plain objects, so existing scenarios keep working.

## When the rules are checked

The rules are judged on the properties **after the button's own property operations**. A button that adds 20 to `heartRate` when it is 110 is judged on 130.

A rule that can't be judged never matches: its property is deleted, its value is a different type to the property, or `>` / `<` is used on something that isn't a number. Evaluation carries on with the next rule.

## Where it lives

| Part | File |
| --- | --- |
| Rules, in one file with no imports | `backend/src/util/properties/destination.js` and `frontend/src/components/Properties/destination.js` (the same file, see below) |
| Server decides where the player goes | `backend/src/routes/api/navigate/user.js` and `group.js` |
| Play page predicts it and switches scene straight away | `PlayScenarioPage.jsx` |
| Editor | Destination section of the Button Actions panel: `DestinationSection.jsx`, `CreateDestinationRule.jsx`, `EditDestinationRule.jsx` |

The two copies of `destination.js` are word for word the same, because the server and the page must agree. A frontend test (`destination.test.js`) fails if they drift apart, and the full set of cases is in `backend/src/util/properties/__tests__/destination.test.js`. When you change one, copy it over the other.

### Navigation

`POST /api/navigate/...` works out the properties after the button's operations **before** saving anything, then picks the destination, then saves the path and the properties together as before. The scenes sent back include **every scene a button can lead to**, from its rules and its fallback, so the page can switch without waiting.

The page uses the same rules to switch scene at once. The server's answer is the authority: if it picks a different scene the page follows it, and the author's debug panel logs that the two disagreed.

## For authors

- **Editor:** select a button, open **Button Actions**. The scene picker is "Linked Scene" until the button has rules, then it becomes "Otherwise go to". **Add Destination Rule** asks for a property, a comparison and a scene. Rules can be moved up and down, because the order is part of what they mean.
- **Deleting a property** also removes the rules that use it, as it does for operations and bindings.
- **Direct link:** a scene whose buttons can lead to more than one scene can't have a direct link, and that includes the scenes in rules.
- **Debug panel:** lists each button's rules, and the event log says which rule matched (`Rule 2 matched: heartRate > 120 (it is 130)`) or that none did.
- **Checks:** flag a rule that uses a deleted property, a comparator the property's type can't use, a value of the wrong type, a condition an earlier rule already has (so it's never reached), a rule with no scene, and a rule leading to a deleted scene.
- **Dashboard graph:** a button's rules draw an edge each, labelled with their condition, and the fallback is labelled "otherwise".

## For the AI assistant

`set_conditional_destination` sets a button's rules and fallback by property and scene **name**. It replaces the rules, so give them all; an empty list removes them. See [AI Assistant](AI%20Assistant.md).
