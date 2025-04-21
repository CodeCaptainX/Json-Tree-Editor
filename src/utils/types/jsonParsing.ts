// Get all paths in the JSON for initial expansion
export const getAllPaths = (obj: any, prefix = ""): string[] => {
  let paths: string[] = [];
  if (obj && typeof obj === "object") {
    Object.keys(obj).forEach((key) => {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      paths.push(currentPath);
      if (obj[key] && typeof obj[key] === "object") {
        paths = [...paths, ...getAllPaths(obj[key], currentPath)];
      }
    });
  }
  return paths;
};
