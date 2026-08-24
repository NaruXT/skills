#!/usr/bin/env bun
// Ejecuta una decisión de promoción/deprecación ya tomada por un humano (ver
// foundry/governance.md, "Checklist de promoción"). Este script NO decide
// nada — solo aplica sin saltos los pasos que antes había que hacer a mano
// en el mismo commit: actualizar foundry/maturity.json, mover la carpeta si
// el canal cruza a/desde stable, y realinear el symlink en ~/.claude/skills.
//
// Uso:
//   bun scripts/promote.mjs <skill> [--channel stable|candidate|experimental]
//                                    [--maturity experimental|dogfooded|evaluated|validated|deprecated]
//                                    [--decision <ruta-relativa-a-foundry/>]
//                                    [--reason "<texto, obligatorio si --maturity deprecated>"]
//                                    [--dry-run]
//                                    [--force-symlink]
//
// Ejemplos:
//   bun scripts/promote.mjs cost-audit --maturity evaluated
//   bun scripts/promote.mjs review-gate --channel stable --decision rounds/002-.../README.md
//   bun scripts/promote.mjs pick-an-issue --maturity deprecated --reason "reemplazada por issue-intake"

import { existsSync, lstatSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { expectedTargetFor, reconcileSymlink } from "./lib/symlinks.mjs";

const REPO_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");
const MATURITY_PATH = join(REPO_ROOT, "foundry", "maturity.json");
const INSTALLED_ROOT = join(homedir(), ".claude", "skills");
const MATURITY_STATES = new Set([
	"experimental",
	"dogfooded",
	"evaluated",
	"validated",
	"deprecated",
]);
const CHANNELS = new Set(["stable", "candidate", "experimental"]);

function parseArgs(argv) {
	const args = { _: [] };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--dry-run") args.dryRun = true;
		else if (a === "--force-symlink") args.forceSymlink = true;
		else if (a === "--channel") args.channel = argv[++i];
		else if (a === "--maturity") args.maturity = argv[++i];
		else if (a === "--decision") args.decision = argv[++i];
		else if (a === "--reason") args.reason = argv[++i];
		else args._.push(a);
	}
	return args;
}

function fail(msg) {
	console.error(`\n✗ ${msg}\n`);
	process.exit(1);
}

function step(msg) {
	console.log(`  - ${msg}`);
}

function physicalRoot(name) {
	const stablePath = join(REPO_ROOT, "skills", name);
	const experimentalPath = join(REPO_ROOT, "skills", ".experimental", name);
	if (existsSync(join(stablePath, "SKILL.md"))) return { root: stablePath, physical: "stable" };
	if (existsSync(join(experimentalPath, "SKILL.md")))
		return { root: experimentalPath, physical: ".experimental" };
	return null;
}

function expectedPathFor(name, channel) {
	return expectedTargetFor(REPO_ROOT, name, channel);
}

// Wrapper fino sobre lib/symlinks.mjs: hace la clasificación+corrección real y
// solo se encarga de imprimir el resultado en el estilo de este script.
function reconcileSymlinkAndReport(name, expectedTarget, { dryRun, forceSymlink }) {
	const installedPath = join(INSTALLED_ROOT, name);
	const result = reconcileSymlink(installedPath, expectedTarget, { dryRun, forceSymlink });

	switch (result.action) {
		case "none":
			step(`symlink: ${name} ya apunta correctamente a ${expectedTarget}`);
			break;
		case "created":
			step(`symlink: no existía ${installedPath} — ${dryRun ? "(dry-run) crearía" : "creado"} enlace a ${expectedTarget}`);
			break;
		case "relinked": {
			const reason = result.status === "broken" ? "estaba roto (apuntaba a una ruta que ya no existe)" : `apuntaba a ${result.resolved}, no a ${expectedTarget}`;
			step(`symlink: ${installedPath} ${reason} — ${dryRun ? "(dry-run) realinearía" : "realineado"}`);
			break;
		}
		case "skipped-needs-force":
			console.warn(
				`\n  ⚠ ${installedPath} es una carpeta/archivo real, no un symlink — posible copia divergente.\n` +
					`    No se toca automáticamente. Si confirmaste que no tiene cambios propios, volvé a` +
					`\n    correr con --force-symlink para reemplazarla por el symlink correcto.\n`,
			);
			break;
		case "replaced":
			step(`symlink: ${installedPath} era una copia real — ${dryRun ? "(dry-run) reemplazaría" : "reemplazado"} por symlink (--force-symlink)`);
			break;
	}
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	const name = args._[0];
	if (!name) fail("falta el nombre de la skill. Uso: bun scripts/promote.mjs <skill> [--channel ...] [--maturity ...]");
	if (!args.channel && !args.maturity) fail("nada para hacer: pasá --channel y/o --maturity.");
	if (args.channel && !CHANNELS.has(args.channel)) fail(`--channel inválido: "${args.channel}". Válidos: ${[...CHANNELS].join(", ")}`);
	if (args.maturity && !MATURITY_STATES.has(args.maturity)) fail(`--maturity inválido: "${args.maturity}". Válidos: ${[...MATURITY_STATES].join(", ")}`);
	if (args.maturity === "deprecated" && !args.reason) fail("--maturity deprecated requiere --reason \"<por qué>\".");

	if (!existsSync(MATURITY_PATH)) fail("no existe foundry/maturity.json");
	const registry = JSON.parse(readFileSync(MATURITY_PATH, "utf8"));
	const entry = registry.skills?.[name];
	if (!entry) fail(`"${name}" no está registrada en foundry/maturity.json`);

	const current = physicalRoot(name);
	if (!current) fail(`"${name}" está en el registro pero no se encontró su SKILL.md en skills/ ni skills/.experimental/`);

	console.log(`\nPromover "${name}"`);
	console.log(`  canal:    ${entry.channel}${args.channel ? ` -> ${args.channel}` : " (sin cambio)"}`);
	console.log(`  madurez:  ${entry.maturity}${args.maturity ? ` -> ${args.maturity}` : " (sin cambio)"}`);
	if (args.dryRun) console.log("  modo:     dry-run — no se escribe nada\n");
	else console.log("");

	// --- Caso especial: deprecación ---
	if (args.maturity === "deprecated") {
		const deprecatedRoot = join(REPO_ROOT, "foundry", "deprecated", name);
		step(`mover ${current.root.replace(REPO_ROOT + "/", "")} -> foundry/deprecated/${name}/`);
		if (!args.dryRun) {
			mkdirSync(dirname(deprecatedRoot), { recursive: true });
			renameSync(current.root, deprecatedRoot);
			writeFileSync(
				join(deprecatedRoot, "DEPRECATION.md"),
				`# ${name} — deprecada\n\n- Fecha: ${new Date().toISOString().slice(0, 10)}\n- Razón: ${args.reason}\n- Decisión: ${args.decision ?? "(agregar link a la ronda que lo decidió)"}\n`,
			);
		}
		step(`quitar "${name}" de foundry/maturity.json (las skills deprecadas salen del registro activo)`);
		if (!args.dryRun) {
			delete registry.skills[name];
			writeFileSync(MATURITY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
		}
		const installedPath = join(INSTALLED_ROOT, name);
		try {
			const lst = lstatSync(installedPath);
			if (lst.isSymbolicLink()) {
				step(`quitar symlink instalado ${installedPath} (skill deprecada, ya no se distribuye)`);
				if (!args.dryRun) unlinkSync(installedPath);
			} else {
				console.warn(`\n  ⚠ ${installedPath} es una carpeta/archivo real — no se toca automáticamente al deprecar.\n`);
			}
		} catch {
			/* no había nada instalado, nada que quitar */
		}
	} else {
		// --- Cambio de madurez y/o canal (sin deprecar) ---
		if (args.maturity) entry.maturity = args.maturity;
		const targetChannel = args.channel ?? entry.channel;
		const crossesStableBoundary =
			args.channel && (entry.channel === "stable") !== (targetChannel === "stable");

		if (crossesStableBoundary) {
			const target = expectedPathFor(name, targetChannel);
			step(`mover ${current.root.replace(REPO_ROOT + "/", "")} -> ${target.replace(REPO_ROOT + "/", "")}/`);
			if (!args.dryRun) {
				mkdirSync(dirname(target), { recursive: true });
				renameSync(current.root, target);
			}
		}
		if (args.channel) entry.channel = args.channel;

		if (args.channel || args.maturity) {
			if (args.decision) entry.decision = args.decision;
			if (!args.dryRun) writeFileSync(MATURITY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
		}

		const expectedTarget = expectedPathFor(name, targetChannel);
		reconcileSymlinkAndReport(name, expectedTarget, { dryRun: args.dryRun, forceSymlink: args.forceSymlink });
	}

	if (args.dryRun) {
		console.log("\nDry-run: nada se escribió. Corré sin --dry-run para aplicar.\n");
		return;
	}

	console.log("\nValidando el catálogo después del cambio...\n");
	try {
		execFileSync("bun", [join(REPO_ROOT, "scripts", "validate-skills.mjs")], {
			cwd: REPO_ROOT,
			stdio: "inherit",
		});
	} catch {
		fail("el catálogo quedó inconsistente después de la promoción — revisá el output de validate-skills.mjs arriba.");
	}

	console.log(`\n✓ "${name}" promovida. Recordá: esto no escribe la ronda de decisión — dejá o actualizá el README en foundry/rounds/ a mano.\n`);
}

main();
