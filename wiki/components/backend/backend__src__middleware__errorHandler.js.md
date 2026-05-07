# Backend Documentation: `backend/src/middleware/errorHandler.js`

## Feature

`backend`

## Module Type

`Middleware`

## Purpose

This file functions as a `middleware` within the backend architecture. It may participate in request handling, database access, middleware execution, business logic, authentication, background processing, or shared utilities.

## Components On Page

- Backend files generally do not render UI components.
- This module contributes to API flow, business logic, or infrastructure.

## Components Used On Page

- `../util/error.js`
- `../util/status.js`

## Related Files

- `../util/error.js`
- `../util/status.js`

## Important Change Notes

!!These files must be checked before making changes as you don't want to repeat code logic!!

- Middleware changes may affect authentication, logging, permissions, or error handling globally.

## Technical Breakdown

- File type: `.js`
- Total lines: `14`
- Import count: `2`
- Export count: `1`
- Exported items: `errorHandler`

## Backend Responsibilities

- Intercepts request/response flow.
- Frequently used for auth, logging, validation, and error handling.
