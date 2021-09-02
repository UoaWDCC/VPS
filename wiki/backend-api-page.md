## Backend API

### Routes

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

`POST /api/scenario/:scenarioId/scene/:sceneId`

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
