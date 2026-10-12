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
