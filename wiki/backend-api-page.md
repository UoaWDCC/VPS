## Backend API

### Routes

**Create new Scenario:**

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

**Delete scenario with given scenario Id:**

`DELETE /api/scenario/:scenarioId`

Returns:

```
NO CONTENT
```

**Create new scene for a given Scenario Id:**

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

**Update a Scene for a given Scene Id:**

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

**Delete scene for a given scenario Id with a given scene Id:**

`DELETE /api/scenario/:scenarioId/scene/:sceneId`

Returns:

```
NO CONTENT
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
**Get images from database**

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
