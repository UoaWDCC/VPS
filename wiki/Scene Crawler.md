# Scene Crawler

The data flow is designed to be asynchronous to provide instant responses to users while still maintaining isolation. This is done by only exposing the active scene and those immediately connected, role dependently.

To maintain integrity across a group, it also relies on a universal scene pointer that is stored in a group object, allowing us to properly handle desynchronisation across different sessions and different users.

## Backend Implementation

The primary functionality exposed by the backend is captured by a sole API endpoint: `/api/navigate/group/:groupId`. This endpoint accepts 3 parameters, 1 mandatory URL parameter and 2 context dependent body props:

- Group ID (URL parameter, mandatory)
- Current Scene ID
- Next Scene ID

The request format is captured by this example axios request (auto generated via postman):

```
const axios = require('axios');
let data = JSON.stringify({
  "currentScene": "66373e81dc2663410c735553",
  "nextScene": "66373e89dc2663410c735565"
});

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'http://localhost:5000/api/navigate/group/6642fdb8a03cb4c2f15213ac',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': '••••••'
  },
  data : data
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
```

There are 3 possible situations that we face when the navigate functionality is called, each one requiring differing logic.

### Situation 1: No member of the group has visited this scenario

In this case, the group object relating to the user will have no scene pointer set, because we don’t initialise that pointer when creating the group.

To overcome this, we fetch the current scenario object and grab the first scene ID that’s stored within it, which we expect to be the entry point of the scenario.

Once, we fetch this ID, we can return the information for that scene along with the connected scenes.

### Situation 2: The user is navigating for the first time in their session

In this case, we need to get the active scene using the group’s pointer, which we know will have already been set by way of Situation 1. Then we can return the information for that scene along with the connected scenes.

We know this situation applies when the request doesn't provide either the current scene or next scene properties.

### Situation 3: The user is navigating between scenes in their session

In this case, we need to first validate the scene transition before making database changes. We can do this by way of two checks:

- Desynchronisation: If the provided current scene property doesn’t match the group’s pointer, we know that the user’s session is out of sync.
- Non-existent edge: If the next scene property is not actually connected to the current scene, we know that this request is either malicious or something else has gone wrong with our frontend code.

If either of these validation checks fail, the endpoint responds with a corresponding error.

After this we return **only** the connected scenes, because we know that the frontend should already have the currently active scene from previous requests.

### Response Format

The following is an example of the response format for a successful request:

```
{
    "active": "66373e89dc2663410c735565",
    "scenes": [
        {
            "_id": "66373e8ddc2663410c735592",
            "components": [
                {
                    "type": "BUTTON",
                    "text": "Button",
                    "variant": "contained",
                    "colour": "white",
                    "nextScene": "66373e90dc2663410c7355d7",
                    "left": 66.98858647936787,
                    "top": 68.95475819032761,
                    "height": 6,
                    "width": 20,
                    "id": "14be0ca7-6531-4c86-bbd3-48032c7ca126"
                }
            ],
            "roles": [
                "Doctor",
                "Nurse"
            ]
        },
        {
            "_id": "66373e89dc2663410c735565",
            "components": [
                {
                    "type": "BUTTON",
                    "text": "Button",
                    "variant": "contained",
                    "colour": "white",
                    "nextScene": "66373e8ddc2663410c735592",
                    "left": 66.11062335381914,
                    "top": 66.14664586583463,
                    "height": 6,
                    "width": 20,
                    "id": "9578d497-883d-4e43-9523-3cf47b0c86a6"
                }
            ],
            "roles": [
                "Doctor"
            ]
        }
    ]
}
```

### Invalid Role Handling

In all of the situations, we perform a simple check after fetching the current active scene to see whether the object’s roles property contains the user’s role. If not, then we respond with a custom error which contains the scene’s roles property for use in the frontend.

```
{
  status: 403,
  error: "Invalid role to access to this scene",
  meta: {
    roles_with_access: ["Doctor", "Nurse"]
  }
}
```

However, because we want to give the user an instant response where possible, we need to also provide this error object in place of any connected scene which the user’s role doesn’t have access to. This way, there wont be a short time span between making the navigate request and receiving the error that we have to fill on the frontend.

> [!NOTE]
> The object that is sent in place of any forbidden connected scenes is identical to the error object

## Frontend Implementation

Relevant file: `frontend/src/features/playScenario/PlayScenarioPage.jsx`.

We use a simple Map object (`sceneCache`) as a basic cache to store the scene data we receive from the API endpoint. We then update that cache alongside the requests we make, return the active scene’s ID, and track active play state with `sceneId`, `stateVariables`, and `stateVersion`.

### Navigation Request and Response

- The page calls:
  - `POST /api/navigate/user/:scenarioId` for singleplayer
  - `POST /api/navigate/group/:groupId` for multiplayer
- It sends `currentScene`, `componentId`, `addFlags`, and `removeFlags`.
- It receives `active`, `stateVariables`, `stateVersion`, and nearby `scenes`.
- Returned scenes are merged into `sceneCache`.

### Scene Click Flow

1. User clicks a clickable component.
2. If `nextScene` is already cached, the UI switches immediately.
3. The app sends the navigate request using `component.id`.
4. The backend confirms the move and returns the authoritative state.
5. The page updates scene/state values and handles errors (`409`, `403`, fallback error route).

In multiplayer, the page also refreshes resources from `GET /api/navigate/group/resources/:groupId` and filters them using current state variables.
