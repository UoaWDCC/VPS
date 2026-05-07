# Backend Documentation: `backend/src/routes/api/navigate/group.js`

## Feature

`backend`

## Module Type

`Route`

## Purpose

This file functions as a `route` within the backend architecture. It may participate in request handling, database access, middleware execution, business logic, authentication, background processing, or shared utilities.

## Components On Page

- Backend files generally do not render UI components.
- This module contributes to API flow, business logic, or infrastructure.

## Components Used On Page

- `../../../db/daos/groupDao.js`
- `../../../db/daos/scenarioDao.js`
- `../../../db/daos/sceneDao.js`
- `../../../db/models/group.js`
- `../../../db/models/note.js`
- `../../../db/models/resource.js`
- `../../../db/models/scenario.js`
- `../../../db/models/scene.js`
- `../../../db/models/user.js`
- `../../../util/error.js`
- `../../../util/statevariables/stateOperations.js`
- `../../../util/status.js`

## Related Files

- `../../../db/daos/groupDao.js`
- `../../../db/daos/scenarioDao.js`
- `../../../db/daos/sceneDao.js`
- `../../../db/models/group.js`
- `../../../db/models/note.js`
- `../../../db/models/resource.js`
- `../../../db/models/scenario.js`
- `../../../db/models/scene.js`
- `../../../db/models/user.js`
- `../../../util/error.js`
- `../../../util/statevariables/stateOperations.js`
- `../../../util/status.js`

## Important Change Notes

!!These files must be checked before making changes as you don't want to repeat code logic!!

- Route changes may break frontend API integration.
- Verify controller mappings and middleware order.

## Technical Breakdown

- File type: `.js`
- Total lines: `307`
- Import count: `12`
- Export count: `5`
- Exported items: `getScenarioFirstScene, getSimpleScene, groupGetResources, groupNavigate, groupReset`

## Backend Responsibilities

- Maps endpoints to controller actions.
- Defines API structure and middleware chains.
