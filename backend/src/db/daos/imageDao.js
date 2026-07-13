import Image from "../models/image.js";
import UploadedFile from "../models/uploadedFile.js";

/**
 * Creates and persists an image object with a url into the database
 * @param {String} url link to the image
 */
const createImage = async ({ id, url, fileName, uploadedAt }) => {
  return new Image({ id, url, fileName, uploadedAt }).save();
};

/**
 * Retrieves all the images stored for a scenario
 * @returns list of database image objects
 */
const retrieveImageList = async (scenarioId) => {
  return UploadedFile.find({ scenarioId, type: "image" }).lean();
};

/**
 * Retrieves a single image by ID
 * @param {String} imageId MongoDB ID of image
 * @returns database image object
 */
const retrieveImage = async (imageId) => {
  return UploadedFile.findById(imageId).lean();
};

export { createImage, retrieveImageList, retrieveImage };
