#!/usr/bin/env bun
import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const candidates = [
	process.env.JOSUE_SKILLS_REPO,
	join(homedir(), "Projects", "skills"),
].filter(Boolean);

for (const candidate of candidates) {
	const root = resolve(candidate);
	if (
		existsSync(join(root, "foundry", "maturity.json")) &&
		existsSync(join(root, "foundry", "cases"))
	) {
		console.log(realpathSync(root));
		process.exit(0);
	}
}

console.error(
	"Repo canónico de skills no encontrado. Definí JOSUE_SKILLS_REPO apuntando al checkout canónico.",
);
process.exit(1);
