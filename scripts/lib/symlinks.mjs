// Clasificación y reconciliación de la instalación local (~/.claude/skills/<n>)
// contra la ubicación canónica dentro de este repo. Método derivado de
// foundry/open-problems/resolved/symlink-drift-detection.research.md
// (lstatSync + isSymbolicLink, nunca statSync/existsSync solos para clasificar).
//
// Usado por scripts/promote.mjs (clasifica y corrige) y
// scripts/monthly-review.mjs (clasifica y solo reporta).

import { existsSync, lstatSync, realpathSync, rmSync, symlinkSync, unlinkSync } from "node:fs";
import { join } from "node:path";

export function expectedTargetFor(repoRoot, name, channel) {
	return channel === "stable"
		? join(repoRoot, "skills", name)
		: join(repoRoot, "skills", ".experimental", name);
}

/**
 * Clasifica una entrada instalada contra la ruta canónica esperada.
 * Nunca escribe nada — solo lee.
 *
 * @returns {{status: "ok"|"missing"|"broken"|"stale"|"divergent-copy", resolved?: string}}
 */
export function classifySymlink(installedPath, expectedTarget) {
	let lst;
	try {
		lst = lstatSync(installedPath);
	} catch {
		return { status: "missing" };
	}

	if (!lst.isSymbolicLink()) {
		return { status: "divergent-copy" };
	}

	let resolved = null;
	try {
		resolved = realpathSync(installedPath);
	} catch {
		resolved = null;
	}
	if (resolved === null) return { status: "broken" };

	const realExpected = existsSync(expectedTarget) ? realpathSync(expectedTarget) : expectedTarget;
	if (resolved !== realExpected) return { status: "stale", resolved };

	return { status: "ok" };
}

/**
 * Aplica la corrección para lo que classifySymlink encontró.
 * dryRun=true no escribe nada. forceSymlink=true permite pisar una copia
 * real divergente (si no, la deja intacta y devuelve action "skipped-needs-force").
 */
export function reconcileSymlink(installedPath, expectedTarget, { dryRun = false, forceSymlink = false } = {}) {
	const found = classifySymlink(installedPath, expectedTarget);

	if (found.status === "ok") return { ...found, action: "none" };

	if (found.status === "missing") {
		if (!dryRun) symlinkSync(expectedTarget, installedPath);
		return { ...found, action: "created" };
	}

	if (found.status === "broken" || found.status === "stale") {
		if (!dryRun) {
			unlinkSync(installedPath);
			symlinkSync(expectedTarget, installedPath);
		}
		return { ...found, action: "relinked" };
	}

	// divergent-copy
	if (!forceSymlink) return { ...found, action: "skipped-needs-force" };
	if (!dryRun) {
		rmSync(installedPath, { recursive: true, force: true });
		symlinkSync(expectedTarget, installedPath);
	}
	return { ...found, action: "replaced" };
}
