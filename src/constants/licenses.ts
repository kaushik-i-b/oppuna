import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

/* eslint-disable @typescript-eslint/no-require-imports -- Metro resolves static license assets. */

export interface LicenseAsset {
  id: string;
  title: string;
  module: number;
  filename: string;
}

/** Bundled offline license assets under assets/licenses/. */
export const LICENSE_ASSETS: LicenseAsset[] = [
  {
    id: 'gemma-notice',
    title: 'Gemma model notice',
    module: require('../../assets/licenses/GEMMA-NOTICE.txt'),
    filename: 'GEMMA-NOTICE.txt',
  },
  {
    id: 'gemma-terms',
    title: 'Gemma Terms of Use',
    module: require('../../assets/licenses/GEMMA-TERMS-OF-USE.txt'),
    filename: 'GEMMA-TERMS-OF-USE.txt',
  },
  {
    id: 'llama-rn',
    title: 'llama.rn (MIT)',
    module: require('../../assets/licenses/llama-rn-MIT.txt'),
    filename: 'llama-rn-MIT.txt',
  },
  {
    id: 'llama-cpp',
    title: 'llama.cpp (MIT)',
    module: require('../../assets/licenses/llama-cpp-MIT.txt'),
    filename: 'llama-cpp-MIT.txt',
  },
];

export async function loadLicenseText(asset: LicenseAsset): Promise<string> {
  const resolved = Asset.fromModule(asset.module);
  await resolved.downloadAsync();
  const uri = resolved.localUri ?? resolved.uri;
  return FileSystem.readAsStringAsync(uri);
}

export function getLicenseAsset(id: string): LicenseAsset | undefined {
  return LICENSE_ASSETS.find((item) => item.id === id);
}
