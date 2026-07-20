#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(projectRoot, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

const appName = packageJson.name;
const version = packageJson.version;
const releaseDir = path.join(projectRoot, "release");

const artifacts = [
  {
    label: "APK",
    source: path.join(
      projectRoot,
      "android",
      "app",
      "build",
      "outputs",
      "apk",
      "release",
      "app-release.apk"
    ),
    targets: [
      `${appName}-${version}-production.apk`,
      `${appName}-${version}.apk`,
    ],
  },
  {
    label: "AAB",
    source: path.join(
      projectRoot,
      "android",
      "app",
      "build",
      "outputs",
      "bundle",
      "release",
      "app-release.aab"
    ),
    targets: [`${appName}-${version}-production.aab`],
  },
];

fs.mkdirSync(releaseDir, { recursive: true });

let copiedArtifactCount = 0;

for (const artifact of artifacts) {
  if (!fs.existsSync(artifact.source)) {
    console.warn(
      `Skipping ${artifact.label}: source not found at ${path.relative(
        projectRoot,
        artifact.source
      )}`
    );
    continue;
  }

  for (const target of artifact.targets) {
    const destination = path.join(releaseDir, target);
    fs.copyFileSync(artifact.source, destination);
    console.log(
      `Copied ${artifact.label} to ${path.relative(projectRoot, destination)}`
    );
    copiedArtifactCount += 1;
  }
}

if (copiedArtifactCount === 0) {
  console.error(
    "No Android release artifacts were found. Build the Android release first."
  );
  console.error(
    "Expected APK at android/app/build/outputs/apk/release/app-release.apk"
  );
  console.error(
    "Expected AAB at android/app/build/outputs/bundle/release/app-release.aab"
  );
  process.exit(1);
}
