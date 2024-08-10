import { Router } from "express";
import auth from "../../middleware/firebaseAuth";

const router = Router();

const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;

// Apply auth middleware to all routes below this point
router.use(auth);

// Create a New Resource
router.post("/resources", async (req, res) => {
    const { type, content } = req.body;
    if (!type || !content) {
      return res.status(HTTP_BAD_REQUEST).send('Bad Request');
    }
    const newResource = await createResource(type, content);
    res.status(HTTP_CREATED).json(newResource);
  });

// Retrieve a Specific Resource
router.get("/resources/:resourceId", async (req, res) => {
  if (!req.params.resourceId) {
    return res.status(HTTP_BAD_REQUEST).send('Bad Request');
  }
  const resource = await getResourceById(req.params.resourceId);
  if (!resource) {
    return res.status(HTTP_NOT_FOUND).send('Not Found');
  }
  res.status(HTTP_OK).json(resource);
});

// Delete a Resource
router.delete("/resources/:resourceId", async (req, res) => {
  if (!req.params.resourceId) {
    return res.status(HTTP_BAD_REQUEST).send('Bad Request');
  }
  const deleted = await deleteResourceById(req.params.resourceId);
  if (!deleted) {
    return res.status(HTTP_NOT_FOUND).send('Not Found');
  }
  res.status(HTTP_NO_CONTENT).send();
});

// Retrieve All Visible Resources
router.get("/group/:groupId/resources", async (req, res) => {
  const { groupId } = req.params;
  if (!groupId) {
    return res.status(HTTP_BAD_REQUEST).send('Bad Request');
  }
  const resources = await getAllVisibleResources(groupId);
  res.status(HTTP_OK).json(resources);
});

// Add a flag to group flags
router.post("/group/:groupId/:flag", async (req, res) => {
  const { groupId, flag } = req.params;
  if (!groupId || !flag) {
    return res.status(HTTP_BAD_REQUEST).send('Bad Request');
  }
  const flags = await addFlag(groupId, flag);
  res.status(HTTP_OK).json(flags);
});

// Remove a flag from group flags
router.delete("/group/:groupId/:flag", async (req, res) => {
  const { groupId, flag } = req.params;
  if (!groupId || !flag) {
    return res.status(HTTP_BAD_REQUEST).send('Bad Request');
  }
  const flags = await removeFlag(groupId, flag);
  res.status(HTTP_OK).json(flags);
});

// Update a Resource
router.put("/resources/:resourceId", checkAuth, async (req, res) => {
  const { resourceId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(HTTP_BAD_REQUEST).send("Bad Request");
  }

  try {
    const updatedResource = await updateResourceById(resourceId, content);

    if (!updatedResource) {
      return res.status(HTTP_NOT_FOUND).send("Not Found");
    }

    res.status(HTTP_OK).json(updatedResource);
  } catch (error) {
    res.status(HTTP_FORBIDDEN).send("Forbidden");
  }
});

export default router;