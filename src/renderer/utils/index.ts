export const tryCathWrapper = async (
  callback: () => Promise<any>,
  customPrefix = "tryCathWrapper error: "
) => {
  try {
    return await callback();
  } catch (error) {
    console.log(customPrefix, error);
  }
};