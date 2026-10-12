# Backend API

> [!WARNING]
> I'm unsure how accurate this documentation is, given that it wasn’t updated at all during 2024. If you find something inaccurate or something missing, please correct it or add in some brief documentation for the endpoint. If you’re unsure ask someone else, it would be great to get it fully accurate at some point. - Hartej

### Routes

**Create new Scenario:\***

`POST /api/scenario`

Returns:

```
{
    "_id": "000001",
    "name": "Scenario 1",
    "scenes": []
}
```

**Retrieve all Scenarios:**

`GET /api/scenario`

Returns:

```
[
    {
        "_id": "000001",
        "name": "Scenario 1"
    },
    {
        "_id": "000002",
        "name": "Scenario 2"
    }
]
```

**Delete scenario with given scenario Id:\***

`DELETE /api/scenario/:scenarioId`

Returns:

```
NO CONTENT
```

**Create new scene for a given Scenario Id:\***

`POST /api/scenario/:scenarioId/scene`

Returns:

```
{
    "_id": "000001",
    "name": "Scene 1",
    "components": []
}
```

**Retrieve all Scenes for a given Scenario Id:**

`GET /api/scenario/:scenarioId/scene`

Returns:

```
[
    {
        "_id": "000001",
        "name": "Scene 1"
    },
    {
        "_id": "000002",
        "name": "Scene 2"
    }
]
```

**Retrieve a Scene for a given Scene Id:**

`GET /api/scenario/:scenarioId/scene/full/:sceneId`

Returns:

```

{
    "_id": "000001",
    "name": "Scene 1"
}

```

***Patch/update a Scene for a given Scene Id:\***

`PATCH /api/scenario/:scenarioId/scene/:sceneId`

Body:

```json
{
    "fields": {
        "name": "Scene 1",
        "time": 60
    },
    "components": [
        {
            "_id": "component-id",
            "properties": {},
            "stateOperations": []
        }
    ],
    "deletedComponentIds": []
}
```

Notes:

- `fields`: top-level scene fields to update (e.g. `name`, `time`)
- `components`: components to update or insert
- `deletedComponentIds`: list of component IDs to remove

Returns:

```json
{
    "message": "Scene updated successfully"
}
```

**Delete scene for a given scenario Id with a given scene Id:\***

`DELETE /api/scenario/:scenarioId/scene/:sceneId`

Returns:

```
NO CONTENT
```

**Duplicate a scene for a given Scenario Id and Scene Id:\***

`POST /api/scenario/:scenarioId/scene/duplicate/:sceneId`

Returns:

```
{
    "_id": "000001",
    "name": "Scene 1",
    "components": []
}
```

All image endpoints require an authorisation header.

**Store image urls in database - developer use only:**

`POST /api/image`

Body:

```

{
    "urls": []
}

```

Returns:

```
{
    "image received"
}
```

**Get images from database:**

`GET /api/image`

Returns:

```
[
    {
        "_id": "000001",
        "url": "https://drive.google.com/uc?export=view&id=18XRH_KNKSjhjTKxonEinMSZXnK1OU2at"
    },
    {
        "_id": "000002",
        "url": "https://drive.google.com/uc?export=view&id=1DkoIzDkld0yogdPNVIvZIAOeoobFVOE2"
    }
]
```

**Get image from database for a given id:**

`GET /api/image/:imageId`

Returns:

```
{
    "_id": "000001",
    "url": "https://drive.google.com/uc?export=view&id=18XRH_KNKSjhjTKxonEinMSZXnK1OU2at"
}

```

## Notes

All note endpoints require an authorisation header.

```
headers: {
      Authorization: `Bearer ${firebase-token}`,
    }
```

The caller's email is derived from their auth token — it does not need to be supplied in the request body. The role is derived from the caller's membership of the group.

**Create a note in a group**

`POST /api/note`

Body:

```

{
    "groupId":  "f38u8d09j012",
    "title":    "Doctor's note"
}

```

Returns:

```
"note created"
```

**Update a note**

`PUT /api/note/update`

Body:

```

{
    "noteId":   "f38u8d09j012",
    "groupId":  "f38u8d09j012",
    "title":    "Doctor's note",
    "text":     "Give him water"
}

```

Returns:

```
"note updated"
```

**Retrieve all notes in a group**

`GET /api/note/retrieveAll/:groupId`

Returns:

```
[
    {
        "_id":      "a8j3ih8f303",
        "title":    "Doctor's note",
        "role":     "Doctor",
        "date":     "date object",
        "text":     "note content"
    },
    ...
]
```

**Delete a note**

`DELETE /api/note/delete`

Body:

```

{
    "noteId":   "f38u8d09j012",
    "groupId":  "f38u8d09j012"
}

```

Returns:

```
"note deleted"
```
---

## Navigate

All navigate endpoints require an authorisation header.

**Navigate (singleplayer):\***

`POST /api/navigate/user/:scenarioId`

Body:

```json
{
    "uid":          "firebase-uid",
    "currentScene": "scene-id-or-null",
    "componentId":  "component-id-or-null",
    "startScene":   "scene-id-or-null"
}
```

- `uid`: the Firebase UID of the authenticated user.
- `currentScene`: the scene the user is currently on. `null` on the first request of a session.
- `componentId`: the component the user interacted with. `null` on the first request of a session.
- `startScene`: _(authors only)_ override the starting scene for this session. Ignored for non-authors. When provided, the user's path is reset to this scene so subsequent navigation stays consistent.

Returns:

```json
{
    "active": "scene-id",
    "scenes": [],
    "properties": [],
    "propertyVersion": 1
}
```

- `active`: the scene the user should now be on.
- `scenes`: the current scene plus directly reachable next scenes, preloaded for the client cache.
- `active` and `scenes` are omitted when the interacted component does not lead to a different scene.
- Where a component leads is its `nextScene`, unless one of its `nextSceneRules` matches. The rules are checked in order on the properties **after** the component's own operations, and the first match wins. See [Conditional Destinations](Specifications/Conditional%20Destinations.md).
- `scenes` includes every scene the active scene's components can lead to: each `nextScene` and each rule's scene.

**Reset (singleplayer):\***

`POST /api/navigate/user/reset/:scenarioId`

Body:

```json
{
    "uid":          "firebase-uid",
    "currentScene": "scene-id"
}
```

Clears the user's path for this scenario, allowing them to start from the beginning. Only valid when the current scene contains a `RESET_BUTTON` component.

Returns: `200 OK` (no body)

**Navigate (multiplayer):\***

`POST /api/navigate/group/:groupId`

Body:

```json
{
    "uid":          "firebase-uid",
    "currentScene": "scene-id-or-null",
    "componentId":  "component-id-or-null",
    "addFlags":     [],
    "removeFlags":  []
}
```

- `uid`: the Firebase UID of the authenticated user.
- `currentScene`: the scene the user is currently on. `null` on the first request of a session.
- `componentId`: the component the user interacted with. `null` on the first request of a session.
- `addFlags`: flags to add to the group's current flags on this navigation step.
- `removeFlags`: flags to remove from the group's current flags on this navigation step.

Response shape is the same as the singleplayer navigate endpoint, operating on the group's shared state instead of an individual user's path. Does not support `startScene`.

**Reset (multiplayer):\***

`POST /api/navigate/group/reset/:groupId`

Body:

```json
{
    "uid":          "firebase-uid",
    "currentScene": "scene-id"
}
```

Same behaviour as the singleplayer reset, applied to the group. Additionally clears all notes for the group and resets the group's current flags.

**Get multiplayer resources:\***

`GET /api/navigate/group/resources/:groupId`

Returns the resources available to the group filtered by the group's current flags.

---

**Reorder scenes for a given Scenario Id:\***

`PUT /api/scenario/:scenarioId/scene/reorder`

Body:

```json
{
    "sceneIds": ["000001", "000002", "000003"]
}
```

Returns:

```json
{
    "message": "Scenes reordered successfully"
}
```

---

### Asset library

A user's library of reusable files. Every route needs a signed-in user and only ever touches that user's own assets. See [Asset Library](./Specifications/Asset%20Library.md).

**List the library:**

`GET /api/assets`

Newest first. Optional query parameters: `type` (`image`, `audio` or `document`), `tag` (one exact tag), `q` (search words, each of which must match the name or a tag) and `limit` (default 200, at most 500).

Returns:

```json
[
    {
        "_id": "000001",
        "name": "heart.png",
        "type": "image",
        "tags": ["heart", "cardiac"],
        "url": "https://firebasestorage.googleapis.com/...",
        "contentType": "image/png",
        "size": 4408,
        "ownerUid": "uid"
    }
]
```

**Upload to the library:**

`POST /api/assets`

Multipart form: `file` (required), `tags` (optional, comma separated) and `name` (optional, defaults to the file name). Subject to the same size and type limits as scenario uploads (`415` for a type that isn't allowed, `413` if it's too large).

Returns the new asset with status `201`.

**Rename or re-tag:**

`PATCH /api/assets/:assetId`

Body (either or both):

```json
{
    "name": "Red heart",
    "tags": ["cardiac", "red"]
}
```

Returns the updated asset. `404` if the asset isn't the caller's.

**Remove from the library:**

`DELETE /api/assets/:assetId`

Returns `204`. The stored file is only deleted if no scenario is using it.

**Use an asset in a scenario:**

`POST /api/assets/:assetId/use`

Body:

```json
{
    "scenarioId": "000001"
}
```

The caller must be able to edit the scenario (`401` otherwise). Returns the scenario's `UploadedFile` for the asset: status `201` the first time, `200` with the same file after that.

---

### AI assistant

The editor's AI assistant talks to the model through the server, so the provider key never reaches the browser. See [AI Assistant](./Specifications/AI%20Assistant.md) for the whole feature and [Setting Up a Local Build](./Onboarding/Setting%20Up%20a%20Local%20Build.md#the-ai-assistant-optional) for the settings it needs.

**Chat:**

`POST /api/ai/chat`

Body (OpenAI-style, plus the scenario and the mode):

```json
{
    "scenarioId": "000001",
    "mode": "build",
    "model": "main",
    "messages": [{ "role": "user", "content": "Make the title bigger" }],
    "tools": [{ "type": "function", "function": { "name": "get_scene", "description": "...", "parameters": {} } }],
    "tool_choice": "auto",
    "max_tokens": 1024,
    "temperature": 0.2
}
```

- `scenarioId`, `mode` and `messages` are required. `mode` is `ask`, `plan`, `build`, `test` or `review`.
- `model` is `"main"` (the default) or `"fast"`, never a model name. The names are the server's settings. `"fast"` uses the main model if no fast one is set.
- `tools` can only be tools the mode allows (`backend/src/util/ai/modes.js`): `403` for one the mode doesn't allow, `400` for one that doesn't exist. `tool_choice` can be `auto`, `none`, `required` or one of the tools offered.
- `max_tokens` can only lower the server's limit. Fields not listed here are not passed on.

The caller must be an author of the scenario (the owner, or someone it's shared with), else `403`.

Returns the model's reply **streamed** as server-sent events (`text/event-stream`), in the OpenAI streaming format, passed through as it is written. The last events carry the token counts, then `data: [DONE]`. The reply headers say how much of today's allowance is used: `X-AI-Limit` and `X-AI-Used`.

If something goes wrong **after** the stream has started, the status is already `200`, so the stream ends with an error event instead:

```
data: {"error": {"message": "The AI took too long, so it was stopped.", "code": "timeout"}}
```

`code` is `timeout` or `interrupted`.

Errors before the stream starts are normal JSON errors:

| Status | When |
| --- | --- |
| `400` | The request isn't valid: no messages, an unknown mode, an unknown tool, a bad `scenarioId` |
| `401` | Not signed in |
| `403` | Not an author of the scenario, or a tool the mode doesn't allow |
| `413` | The request is bigger than `AI_MAX_INPUT_CHARS` |
| `429` | The author's daily limit is used up (`meta.limit`, `meta.resetsAt`, and a `Retry-After` header), or the provider is busy (`meta.retryAfter`) |
| `502` | The provider can't be reached, refused the server's key, or couldn't handle the request (`meta.upstreamStatus`, and `meta.message` when the provider said why) |
| `503` | The assistant isn't set up (`meta.missing` lists the settings that are missing), or the provider account is out of credit |
| `504` | The model didn't start replying in time |

A request that fails before the model replies isn't counted against the daily limit. The limit is per author per UTC day and is kept in the database (`aiUsage`), so it holds across servers and restarts.

Each request writes one log line (`"event": "ai.chat"`) with the author, scenario, mode, model, token counts, time taken and the names of the tools the model called. It does not contain what was typed or the scenario's text, unless `AI_LOG_CONTENT=true`.
