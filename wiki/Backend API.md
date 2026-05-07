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

\* Requires authorisation header

```
headers: {
      Authorization: `Bearer ${firebase-token}`,
    }
```

**Create note in a group with given groupId, title and a role**

`POST /api/note`

Body:

```

{
    "groupId":  "f38u8d09j012",
    "title":    "Doctor's note",
    "role":     "Doctor"
}

```

Returns:

```
{
    "note created"
}
```

**Update a note with given noteId, text and title**

`POST /api/note/update`

Body:

```

{
    "noteId":  "f38u8d09j012",
    "title":    "Doctor's note",
    "text":     "Give him water"
}

```

Returns:

```
{
    "note updated"
}
```

**Retrieve all notes in a group with given groupId**

`POST /api/note/retrieveList`

Body:

```

{
    "groupId":  "f38u8d09j012",
}

```

Returns:

```
{
    {
        "_id":      "a8j3ih8f303",
        "title":    "Doctor's note",
        "role":     "Doctor",
        "date":     "date object",
        "text":     "note content"
    },
    {
        more notes
    }
}
```

**Delete a notes in a group with given noteId and groupId**

`POST /api/note/delete`

Body:

```

{
    "noteId":   "f38u8d09j012",
    "groupId":  "f38u8d09j012",
}

```

Returns:

```
{
    "note deleted"
}
```
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
