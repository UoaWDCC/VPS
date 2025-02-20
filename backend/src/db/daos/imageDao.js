import Image from "../models/image.js";

/**
 * Creates and persists an image object with a url into the database
 * @param {String} url link to the image
 */
const createImage = async (url) => {
  return new Image({ url }).save();
};

/**
 * Retrieves all the images stored in the database
 * @returns list of database image objects
 */
const retrieveImageList = async () => {
  return Image.find().sort({ url: 1 });
};

/**
 * Retrieves a single image object from the database by ID
 * @param {String} imageId MongoDB ID of image
 * @returns database image object
 */
const retrieveImage = async (imageId) => {
  return Image.findById(imageId);
};

export { createImage, retrieveImageList, retrieveImage };
