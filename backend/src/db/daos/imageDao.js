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

// eslint-disable-next-line import/prefer-default-export
export { createImage, retrieveImageList };
