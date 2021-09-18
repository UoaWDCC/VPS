/* eslint-disable no-underscore-dangle */
import Image from "../models/image";

const createImage = async (url) => {
  const dbImage = new Image({
    url,
  });
  await dbImage.save();
};

const retrieveImageList = async () => {
  return Image.find();
};

const retrieveImage = async (imageId) => {
  return Image.findById(imageId);
};

// eslint-disable-next-line import/prefer-default-export
export { createImage, retrieveImageList, retrieveImage };
