const fs = require("fs");
const { execSync } = require("child_process");

// Get the version from package.json
const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));
const currentVersion = packageJson.version;

// Get the latest commit message
const latestCommitMessage = execSync("git log -1 --pretty=%B")
  .toString()
  .trim();

// Get the version bump type from command line argument
const bumpType = process.argv[2];

// triger running build version
execSync("npm run build");

// Increment the version based on the bump type
let [major, minor, patch] = currentVersion.split(".");
switch (bumpType) {
  case "major":
    major++;
    minor = 0;
    patch = 0;
    break;
  case "minor":
    minor++;
    patch = 0;
    break;
  case "patch":
    patch++;
    break;
  default:
    console.error('Invalid bump type. Use "major", "minor", or "patch".');
    process.exit(1);
}

// Update the version in package.json
const newVersion = `${major}.${minor}.${patch}`;
packageJson.version = newVersion;
fs.writeFileSync("./package.json", JSON.stringify(packageJson, null, 2));

// Create a log file with the new version and latest commit message
const log = `## Version: ${newVersion}\n${latestCommitMessage}\n\n`;
fs.writeFileSync(`./VERSION.md`, log, { flag: "a" });
console.log(`Version bumped to ${newVersion}. Log file created.`);

// const fs = require("fs");

// // Read the package.json file
// const packageJson = JSON.parse(fs.readFileSync("package.json"));

// // Split the version number string into an array of numbers
// const versionNumbers = packageJson.version.split(".");

// // Increment the last number
// versionNumbers[versionNumbers.length - 1] = parseInt(versionNumbers[versionNumbers.length - 1]) + 1;

// // Join the numbers back into a string and set the new version number
// packageJson.version = versionNumbers.join(".");

// // Write the updated package.json file
// fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));

// console.log(`Version updated to ${packageJson.version}`);
