export const loadImageData = (url: string): Promise<HTMLImageElement> => {
  const image = new Image();
  image.src = url;

  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = reject;
  });
};
