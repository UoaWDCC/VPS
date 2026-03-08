# Auth Implementation Guide

## Frontend Auth

Accessing Auth Protected API Endpoints

To access an authentication-protected backend, follow these steps:

### 1. Include the Auth Token in the Header

Ensure that the authorization token is included in the header of every request. This token is typically retrieved after a successful login.

Example:

```
// import user Token from Context
const { user, loading, error } = useContext(AuthenticationContext);

//Check if finished loading
if (loading) {
  // handle loading state
  //show loading spinner or smt
} if (error) {
  //handle error
} if (user) {
  const token = await user.getIdToken(); // Function to retrieve the auth token
  const response = await fetch("https://your-api-endpoint.com", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
}
```

### 2. Handle Token Expiry and Refresh

Ensure your application handles token expiry. Implement logic to refresh the token when it expires.

Example:

```
const fetchWithAuth = async (url, options = {}) => {
  let token = await getAuthToken();
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (response.status === 401) {
    // Refresh the token if it's expired and retry the request
    token = await refreshAuthToken();
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }
  return response;
};
```

## Backend Auth

### Implementing an Auth Protected Backend Endpoint

To implement authentication-protected backend endpoints using Firebase authentication and scenario-based authorization, follow these steps:

#### Protect Your API Routes with the Middlewares

Apply these the Firebase authorization and scenario authentication middlewares to your API routes to ensure they are protected by both Firebase authorization and scenario-based authentication .

Example:

(Example is from `scenario.js`)

1. Import authorization from firebaseAuth and import Scenario Authentication from scenarioAuth (also make sure you import the functions from the dao) 

```
import { Router } from "express";
import auth from "../../middleware/firebaseAuth";
import scenarioAuth from "../../middleware/scenarioAuth";
import {
  createScenario,
  retrieveScenarioList,
  updateScenario,
  deleteScenario,
  updateDurations,
} from "../../db/daos/scenarioDao";
import { retrieveAssignedScenarioList } from "../../db/daos/userDao";
```

2. Apply Firebase Authorization protection to your routes

```
// Apply Firebase auth middleware to all routes
router.use(auth);

// put API end points that require firebase Auth here
```

3. Apply scenario Authentication protection to your routes

```
// Apply scenario auth middleware
router.use("/:scenarioId", scenarioAuth);

// put API end points that require scenario auth here
```
