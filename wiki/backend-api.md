## Backend API

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

**Update a Scene for a given Scene Id:\***

`PUT /api/scenario/:scenarioId/scene/:sceneId`

Body:

```

{
    "name": "Scene 1",
    "components": []
}

```

Returns:

```

{
    "_id": "000001",
    "name": "Scene 1",
    "components": []
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
    "note updated"
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
    {
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
