export type PackageInfo = {
  name: string;
  version: string;
  description?: string;
};

/**
 * Get informations about a NPM package.
 *
 * @param name Package name.
 * @returns The package.json file as a JavaScript object.
 */
export const packageInfo = async (name: string): Promise<PackageInfo> => {
  const res = await fetch(`https://unpkg.com/${name}/package.json`);
  const infos = await res.json();
  return infos;
};

/**
 * Get metadata of a barnard59 package.
 *
 * @param name Package name.
 */
export const packageManifest = async (name: string) => {
  const res = await fetch(`https://unpkg.com/${name}/manifest.ttl`);
  // TODO: return something useful
};
