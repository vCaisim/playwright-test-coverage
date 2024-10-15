const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const baseTest = require("@playwright/test").test;
const istanbul = require("istanbul-lib-coverage");

const istanbulTempDir = process.env.ISTANBUL_TEMP_DIR
  ? path.resolve(process.env.ISTANBUL_TEMP_DIR)
  : path.join(process.cwd(), ".nyc_output");

function getProjectName(project) {
  return project.name || "project";
}

function getProjectDir(project) {
  return path.join(istanbulTempDir, getProjectName(project));
}

function generateUUID() {
  return crypto.randomBytes(16).toString("hex");
}

async function collectCoverageFromFiles(coverageDir) {
  const coverageFiles = await fs.promises.readdir(coverageDir);
  const coverageMap = istanbul.createCoverageMap();

  for (const file of coverageFiles) {
    const filePath = path.join(coverageDir, file);
    const fileCoverageData = await fs.promises.readFile(filePath, "utf8");
    const fileCoverage = istanbul.createCoverageMap(
      JSON.parse(fileCoverageData),
    );
    coverageMap.merge(fileCoverage);
  }

  return coverageMap;
}

const test = baseTest.extend({
  context: async ({ context }, use, { project, testId, retry }) => {
    await context.addInitScript(() =>
      window.addEventListener("beforeunload", () =>
        window.collectIstanbulCoverage(JSON.stringify(window.__coverage__)),
      ),
    );

    const projectDir = getProjectDir(project);
    const coverageDir = path.join(projectDir, `${testId}-${retry}`);

    await fs.promises.mkdir(coverageDir, { recursive: true });

    await context.exposeFunction(
      "collectIstanbulCoverage",
      async (coverageJSON) => {
        if (coverageJSON) {
          const coverageFilePath = path.join(
            coverageDir,
            `${generateUUID()}.json`,
          );
          await fs.promises.writeFile(coverageFilePath, coverageJSON);
        }
      },
    );

    await use(context);

    for (const page of context.pages()) {
      await page.evaluate(() =>
        window.collectIstanbulCoverage(JSON.stringify(window.__coverage__)),
      );
    }

    const coverageMap = await collectCoverageFromFiles(coverageDir);
    const coverageOutputPath = path.join(projectDir, `${testId}-${retry}.json`);
    await fs.promises.writeFile(
      coverageOutputPath,
      JSON.stringify(coverageMap, null, 2),
    );
  },
});

const expect = test.expect;

module.exports = { test, expect };
