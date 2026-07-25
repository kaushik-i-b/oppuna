#!/usr/bin/env node
/**
 * Inspects a built Android App Bundle for on-device LLM install-time delivery + privacy.
 *
 * Usage: npm run verify:aab -- path/to/app.aab
 *
 * Uses streaming hashes (never loads the full GGUF into memory).
 * Reports BLOCKED (not PASS) when required inspection tools are unavailable
 * for checks that cannot be completed via ZIP listing alone.
 */

const { execSync, spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadLocalModelConfig } = require('./lib/localModelConfig');
const { MIN_TARGET_SDK } = require('./lib/aabManifestChecks');

const ROOT = path.join(__dirname, '..');
const APP_JSON = path.join(ROOT, 'app.json');
const GGUF_MAGIC = Buffer.from('GGUF', 'ascii');

function pass(msg) {
  console.log(`PASS ${msg}`);
}
function fail(msg) {
  console.error(`FAIL ${msg}`);
}
function blocked(msg) {
  console.error(`BLOCKED ${msg}`);
}

function commandExists(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function unzipList(aabPath) {
  return execSync(`unzip -l ${JSON.stringify(aabPath)}`, { encoding: 'utf8' });
}

function parseUnzipSize(listing, needle) {
  const lines = listing.split('\n').filter((l) => l.includes(needle));
  for (const line of lines) {
    // unzip -l format: length date time name
    const match = line.trim().match(/^(\d+)\s+\d{2}-\d{2}-\d{4}/);
    if (match) return Number(match[1]);
  }
  return null;
}

function streamShaFromUnzipStreaming(aabPath, entryPath) {
  const { spawn } = require('child_process');
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const header = Buffer.alloc(4);
    let headerFilled = 0;
    let total = 0;
    const child = spawn('unzip', ['-p', aabPath, entryPath]);
    child.stdout.on('data', (chunk) => {
      total += chunk.length;
      if (headerFilled < 4) {
        const need = 4 - headerFilled;
        chunk.copy(header, headerFilled, 0, Math.min(need, chunk.length));
        headerFilled += Math.min(need, chunk.length);
      }
      hash.update(chunk);
    });
    child.stderr.on('data', () => {});
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`unzip -p failed for ${entryPath} (code ${code})`));
        return;
      }
      resolve({
        sha256: hash.digest('hex'),
        size: total,
        ggufHeaderValid: headerFilled === 4 && header.equals(GGUF_MAGIC),
      });
    });
  });
}

function findModelEntry(listing, packName, fileName) {
  const lines = listing.split('\n').filter((l) => l.includes(fileName));
  const preferred = lines.find((l) => l.includes(packName));
  const line = preferred || lines[0];
  if (!line) return null;
  const nameMatch = line.match(/\s(\S+\.gguf)\s*$/);
  if (!nameMatch) {
    // Fallback: last token
    const parts = line.trim().split(/\s+/);
    return parts[parts.length - 1] || null;
  }
  return nameMatch[1];
}

function extractStringsFromBinary(buf) {
  const strings = [];
  let current = '';
  for (let i = 0; i < buf.length; i += 1) {
    const c = buf[i];
    if (c >= 32 && c < 127) {
      current += String.fromCharCode(c);
    } else {
      if (current.length >= 4) strings.push(current);
      current = '';
    }
  }
  if (current.length >= 4) strings.push(current);
  return strings;
}

function inspectDeliveryType(aabPath, packName, tmpDir) {
  // Prefer extracting pack metadata / build artifacts that mention delivery.
  try {
    execSync(
      `unzip -o -q ${JSON.stringify(aabPath)} "${packName}/*" -d ${JSON.stringify(tmpDir)}`,
      { stdio: 'pipe' },
    );
  } catch {
    // Partial extract may still succeed for small metadata files.
  }

  const candidates = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else candidates.push(full);
    }
  }
  walk(path.join(tmpDir, packName));

  for (const file of candidates) {
    const base = path.basename(file).toLowerCase();
    if (base.endsWith('.gguf')) continue;
    if (fs.statSync(file).size > 5_000_000) continue;
    const buf = fs.readFileSync(file);
    const text = buf.toString('utf8');
    if (/install-time/i.test(text) || /INSTALL_TIME/.test(text)) {
      return { ok: true, evidence: path.relative(tmpDir, file) };
    }
    const strings = extractStringsFromBinary(buf);
    if (strings.some((s) => /install-time/i.test(s) || s === 'INSTALL_TIME')) {
      return { ok: true, evidence: path.relative(tmpDir, file) };
    }
  }

  // Also scan BundleConfig.pb / tip of AAB for pack delivery enum.
  try {
    const bundleConfig = spawnSync('unzip', ['-p', aabPath, 'BundleConfig.pb'], {
      encoding: 'buffer',
      maxBuffer: 10_000_000,
    });
    if (bundleConfig.status === 0 && bundleConfig.stdout) {
      const strings = extractStringsFromBinary(bundleConfig.stdout);
      if (strings.some((s) => /install.?time/i.test(s) || s.includes(packName))) {
        // Presence of pack name alone is weak; look for INSTALL_TIME specifically.
        if (strings.some((s) => s.includes('INSTALL_TIME') || /install-time/i.test(s))) {
          return { ok: true, evidence: 'BundleConfig.pb' };
        }
      }
    }
  } catch {
    // continue
  }

  return { ok: false, evidence: null };
}

function inspectManifestWithBundletool(aabPath) {
  if (!commandExists('bundletool')) return null;
  try {
    const xml = execSync(`bundletool dump manifest --bundle=${JSON.stringify(aabPath)}`, {
      encoding: 'utf8',
      maxBuffer: 20_000_000,
    });
    return xml;
  } catch {
    return null;
  }
}

function inspectManifestViaUnzip(aabPath, tmpDir) {
  try {
    execSync(
      `unzip -o -q ${JSON.stringify(aabPath)} "base/manifest/AndroidManifest.xml" -d ${JSON.stringify(tmpDir)}`,
      { stdio: 'pipe' },
    );
    const manifestPath = path.join(tmpDir, 'base', 'manifest', 'AndroidManifest.xml');
    if (!fs.existsSync(manifestPath)) return null;
    return fs.readFileSync(manifestPath);
  } catch {
    return null;
  }
}

async function main() {
  const aabArg = process.argv[2];
  if (!aabArg) {
    console.error('Usage: npm run verify:aab -- <path-to.aab>');
    process.exit(1);
  }

  const failures = [];
  const blocks = [];
  const config = loadLocalModelConfig();
  const app = JSON.parse(fs.readFileSync(APP_JSON, 'utf8'));
  const expectedPackage = app.expo?.android?.package || config.packageId;
  const expectedVersionName = app.expo?.version;
  const expectedVersionCode = app.expo?.android?.versionCode;

  console.log('AAB VALIDATION\n');

  const aabPath = path.resolve(aabArg);
  if (!fs.existsSync(aabPath)) {
    fail(`AAB not found: ${aabPath}`);
    process.exit(1);
  }
  pass('AAB exists');

  let listing = '';
  try {
    listing = unzipList(aabPath);
    pass('AAB is structurally readable (ZIP)');
  } catch (error) {
    fail(`Could not list AAB contents: ${error.message}`);
    process.exit(1);
  }

  if (!listing.includes(config.assetPackName)) {
    fail(`Asset pack module "${config.assetPackName}" not found in AAB`);
    failures.push('asset pack missing');
  } else {
    pass(`Asset pack "${config.assetPackName}" present`);
  }

  const modelEntry = findModelEntry(listing, config.assetPackName, config.fileName);
  if (!modelEntry) {
    fail(`${config.fileName} not found inside asset pack`);
    failures.push('model.gguf missing');
  } else {
    pass(`${config.fileName} listed at ${modelEntry}`);
  }

  const listedSize = modelEntry ? parseUnzipSize(listing, modelEntry) : null;
  if (listedSize !== null) {
    if (listedSize !== config.expectedSize) {
      fail(`Model entry size mismatch: expected ${config.expectedSize}, got ${listedSize}`);
      failures.push('model size');
    } else {
      pass(`Model entry size matches expected (${listedSize})`);
    }
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oppuna-aab-'));
  try {
    const delivery = inspectDeliveryType(aabPath, config.assetPackName, tmpDir);
    if (delivery.ok) {
      pass(`Install-time delivery evidence found (${delivery.evidence})`);
    } else if (commandExists('bundletool')) {
      // Try bundletool get-size / dump — still may not expose delivery.
      blocked('Could not confirm install-time delivery from AAB metadata');
      blocks.push('install-time delivery');
    } else {
      // Source config + Gradle are install-time; AAB evidence missing.
      blocked(
        'Install-time delivery not confirmed in AAB metadata (bundletool unavailable)',
      );
      blocks.push('install-time delivery');
    }

    // Manifest / package / permissions
    let manifestXml = inspectManifestWithBundletool(aabPath);
    if (manifestXml) {
      pass('Manifest decoded via bundletool');
      if (!manifestXml.includes(expectedPackage)) {
        fail(`Package ID missing or incorrect (expected ${expectedPackage})`);
        failures.push('packageId');
      } else {
        pass(`Package ID (artifact) = ${expectedPackage}`);
      }

      const actualVersionCodeMatch = manifestXml.match(
        /android:versionCode\s*=\s*"?(\d+)"?/,
      );
      const actualVersionNameMatch = manifestXml.match(
        /android:versionName\s*=\s*"([^"]+)"/,
      );
      if (!actualVersionCodeMatch) {
        blocked('android:versionCode not found in decoded AAB manifest');
        blocks.push('versionCode');
      } else {
        const actualVersionCode = Number(actualVersionCodeMatch[1]);
        if (actualVersionCode !== Number(expectedVersionCode)) {
          fail(
            `versionCode mismatch: AAB has ${actualVersionCode}, app.json expects ${expectedVersionCode}`,
          );
          failures.push('versionCode');
        } else {
          pass(`versionCode (artifact) = ${actualVersionCode}`);
        }
      }
      if (!actualVersionNameMatch) {
        blocked('android:versionName not found in decoded AAB manifest');
        blocks.push('versionName');
      } else {
        const actualVersionName = actualVersionNameMatch[1];
        if (actualVersionName !== String(expectedVersionName)) {
          fail(
            `versionName mismatch: AAB has "${actualVersionName}", app.json expects "${expectedVersionName}"`,
          );
          failures.push('versionName');
        } else {
          pass(`versionName (artifact) = ${actualVersionName}`);
        }
      }

      if (/android\.permission\.INTERNET/.test(manifestXml) && !/tools:node="remove"/.test(manifestXml)) {
        const internetLines = manifestXml
          .split('\n')
          .filter((l) => l.includes('android.permission.INTERNET'));
        const stillPresent = internetLines.some((l) => !l.includes('tools:node="remove"'));
        if (stillPresent) {
          fail('INTERNET permission present in final manifest');
          failures.push('INTERNET');
        } else {
          pass('INTERNET permission removed');
        }
      } else if (!/android\.permission\.INTERNET/.test(manifestXml)) {
        pass('INTERNET permission absent');
      } else {
        pass('INTERNET permission removed (tools:node=remove)');
      }
      if (/android:allowBackup\s*=\s*"false"/.test(manifestXml)) {
        pass('android:allowBackup="false"');
      } else {
        fail('android:allowBackup="false" not found in manifest');
        failures.push('allowBackup');
      }
      const sdkMatch = manifestXml.match(/android:targetSdkVersion\s*=\s*"?(\d+)"?/);
      if (sdkMatch) {
        const sdk = Number(sdkMatch[1]);
        console.log(`Expected minimum targetSdk: ${MIN_TARGET_SDK}`);
        console.log(`Actual AAB targetSdk: ${sdk}`);
        if (sdk < MIN_TARGET_SDK) {
          fail(`targetSdkVersion ${sdk} is below required minimum (${MIN_TARGET_SDK})`);
          failures.push('targetSdk');
        } else {
          pass(`targetSdkVersion (artifact) = ${sdk} (>= ${MIN_TARGET_SDK})`);
        }
      } else {
        blocked('targetSdkVersion not found in decoded manifest');
        blocks.push('targetSdk');
      }
    } else {
      blocked(
        'bundletool or equivalent manifest inspection unavailable — cannot verify artifact versionCode/versionName/package from AAB',
      );
      blocks.push('manifest');
      const binaryManifest = inspectManifestViaUnzip(aabPath, tmpDir);
      if (binaryManifest) {
        const strings = extractStringsFromBinary(binaryManifest);
        if (strings.includes(expectedPackage)) {
          pass(`Package ID string found in binary manifest (${expectedPackage})`);
        } else {
          fail(`Package ID ${expectedPackage} not found in binary manifest`);
          failures.push('packageId');
        }
        if (strings.includes('android.permission.INTERNET')) {
          blocked('INTERNET permission cannot be conclusively verified without bundletool');
          blocks.push('INTERNET');
        } else {
          pass('INTERNET permission string absent from binary manifest');
        }
        blocked(
          'Full manifest checks (versionCode/versionName/allowBackup/targetSdk) require bundletool',
        );
        blocks.push('manifest details');
      }
    }

    // Legal assets in base module
    const licenseHits = ['QWEN-NOTICE', 'QWEN-LICENSE', 'llama-rn-MIT', 'llama-cpp-MIT'].filter(
      (name) => listing.includes(name),
    );
    if (licenseHits.length > 0) {
      pass(`Legal assets present in AAB (${licenseHits.join(', ')})`);
    } else {
      console.log(
        'INFO legal license files not found as discrete AAB entries (may be bundled via Expo asset pipeline)',
      );
    }

    // Stale Gemma legal / naming must never ship in a Qwen production AAB.
    const gemmaHits = listing
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /gemma/i.test(l));
    if (gemmaHits.length > 0) {
      fail('AAB contains prohibited Gemma assets/paths');
      for (const hit of gemmaHits.slice(0, 8)) {
        console.error(`  - ${hit}`);
      }
      failures.push('gemma assets');
    } else {
      pass('No Gemma-named assets in AAB listing');
    }

    // Stream model SHA
    if (modelEntry) {
      try {
        const streamed = await streamShaFromUnzipStreaming(aabPath, modelEntry);
        if (streamed.size !== config.expectedSize) {
          fail(`Streamed model size mismatch: expected ${config.expectedSize}, got ${streamed.size}`);
          failures.push('streamed size');
        } else {
          pass(`Streamed model size = ${streamed.size}`);
        }
        if (!streamed.ggufHeaderValid) {
          fail('Invalid GGUF header in packaged model');
          failures.push('gguf');
        } else {
          pass('GGUF header valid in AAB');
        }
        if (streamed.sha256 !== config.sha256) {
          fail('SHA-256 mismatch in packaged model');
          failures.push('sha256');
        } else {
          pass('SHA-256 matches configured digest (streamed)');
        }
        // Stale pre-Qwen packs were ~806 MB; reject obvious legacy size even if config drifts.
        if (streamed.size === 806058496) {
          fail('Packaged model size matches legacy pre-Qwen GGUF — rebuild with Qwen weights');
          failures.push('legacy model size');
        }
      } catch (error) {
        fail(`Could not stream model from AAB: ${error.message}`);
        failures.push('model stream');
      }
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log('');
  if (failures.length > 0) {
    console.error('AAB validation FAILED:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  if (blocks.length > 0) {
    console.error('AAB validation BLOCKED (incomplete inspection):');
    for (const b of blocks) console.error(`  - ${b}`);
    process.exit(2);
  }

  console.log('AAB validation passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
