import { Router } from "express";

const router = Router();

const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;

// Create a New Resource
router.post("/resources", async (req, res) => {
    const { type, content } = req.body;
    if (!type || !content) {
      return res.status(HTTP_BAD_REQUEST).send('Bad Request');
    }
    const newResource = await createResource({ type, content });
    res.status(HTTP_CREATED).json(newResource);
  });

// Retrieve a Specific Resource
router.get("/resources/:resourceId", async (req, res) => {
  const resource = await getResourceById(req.params.resourceId);
  if (!resource) {
    return res.status(HTTP_NOT_FOUND).send('Not Found');
  }
  res.status(HTTP_OK).json(resource);
});

// Delete a Resource
router.delete("/resources/:resourceId", async (req, res) => {
  const deleted = await deleteResourceById(req.params.resourceId);
  if (!deleted) {
    return res.status(HTTP_NOT_FOUND).send('Not Found');
  }
  res.status(HTTP_NO_CONTENT).send();
});


// Retrieve All Visible Resources
router.get("/group/:groupId/resources", async (req, res) => {
  const { groupId } = req.params;
  const resources = await getAllVisibleResources(groupId);
  res.status(HTTP_OK).json(resources);
});

export default router;