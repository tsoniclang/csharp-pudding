import assert from "node:assert/strict";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { projectSpecs } from "./config.mjs";
import { recordEvidence, runCommand } from "./runner.mjs";

export async function selectStagedFramework(context, task) {
  const framework = process.env.PROOF_TARGET_FRAMEWORK;
  const sdk = process.env.PROOF_DOTNET_SDK;
  if (framework === undefined && sdk === undefined) return;
  assert.match(framework ?? "", /^net[1-9][0-9]+\.0$/u, "PROOF_TARGET_FRAMEWORK must select .NET 10 or later.");
  assert.match(sdk ?? "", /^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/u, "PROOF_DOTNET_SDK must select an exact installed SDK.");
  await writeFile(resolve(context.stageRoot, "global.json"), `${JSON.stringify({ sdk: {
    version: sdk, rollForward: "disable", allowPrerelease: true,
  } }, null, 2)}\n`);
  const selected = await runCommand(context, task, {
    id: "select-framework-sdk", executable: "dotnet", args: ["--version"], cwd: context.stageRoot,
    memoryMiB: 512, timeoutMinutes: 1, environment: {},
  });
  assert.equal(selected.stdout.trim(), sdk);
  for (const project of projectSpecs) {
    const root = resolve(context.stageRoot, project.path);
    const configPath = resolve(root, "tsonic.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.targets[0].options.targetFramework = framework;
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
    if (project.projectFile !== undefined) {
      const nativePath = resolve(root, project.projectFile);
      const native = await readFile(nativePath, "utf8");
      assert.equal([...native.matchAll(/<TargetFramework>[^<]+<\/TargetFramework>/gu)].length, 1, nativePath);
      await writeFile(nativePath, native.replace(/<TargetFramework>[^<]+<\/TargetFramework>/u, `<TargetFramework>${framework}</TargetFramework>`));
    }
  }
  for (const nativePath of await runtimeProjects(context.stageRoot)) {
    const native = await readFile(nativePath, "utf8");
    await writeFile(nativePath, native.replace(/<TargetFramework>[^<]+<\/TargetFramework>/gu, `<TargetFramework>${framework}</TargetFramework>`));
  }
  context.selectedFramework = framework;
  recordEvidence(context, `FRAMEWORK framework=${framework} sdk=${sdk} authored_source=unchanged`);
}

async function runtimeProjects(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await runtimeProjects(path));
    else if (entry.isFile() && entry.name.endsWith(".csproj") && path.includes("/runtime/")) files.push(path);
  }
  return files;
}
