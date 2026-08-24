#!/usr/bin/env bun
// Prepara el borrador de una ronda de revisión mensual: pull de skillkit,
// diff de qué cambió en foundry/cases/ y foundry/runs/ desde la última
// revisión, y un README.md de ronda listo para que un humano lo lea y
// decida — nunca toca foundry/maturity.json ni ejecuta promote.mjs.
//
// Pensado para correr disparado a mano (recordatorio de calendario ->
// sesión de Claude Code en este repo -> "corré la revisión mensual"), no
// desde un cron ni un agente en la nube: necesita el ~/.skillkit/analytics.db
// local, que solo existe en esta máquina.
//
// Uso:
//   bun scripts/monthly-review.mjs

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const REPO_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");
const MATURITY_PATH = join(REPO_ROOT, "foundry", "maturity.json");
const LAST_REVIEW_PATH = join(REPO_ROOT, "foundry", ".last-monthly-review");
const CASES_DIR = join(REPO_ROOT, "foundry", "cases");
const RUNS_DIR = join(REPO_ROOT, "foundry", "runs");
const ROUNDS_DIR = join(REPO_ROOT, "foundry", "rounds");

function today() {
	return new Date().toISOString().slice(0, 10);
}

function lastReviewDate() {
	if (!existsSync(LAST_REVIEW_PATH)) return null;
	return readFileSync(LAST_REVIEW_PATH, "utf8").trim() || null;
}

function filesNewerThan(dir, cutoffMs) {
	if (!existsSync(dir)) return [];
	const out = [];
	for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
		if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "README.md") continue;
		const full = join(entry.parentPath ?? dir, entry.name);
		if (statSync(full).mtimeMs > cutoffMs) out.push(full.replace(`${REPO_ROOT}/`, ""));
	}
	return out;
}

function nextRoundNumber() {
	if (!existsSync(ROUNDS_DIR)) return 1;
	const nums = readdirSync(ROUNDS_DIR, { withFileTypes: true })
		.filter((e) => e.isDirectory())
		.map((e) => Number.parseInt(e.name.slice(0, 3), 10))
		.filter((n) => !Number.isNaN(n));
	return nums.length ? Math.max(...nums) + 1 : 1;
}

function runSkillkit() {
	try {
		const raw = execFileSync("npx", ["-y", "@crafter/skillkit", "stats", "--all", "--days", "90", "--json"], {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		});
		return JSON.parse(raw);
	} catch (err) {
		console.warn(`⚠ no se pudo correr skillkit (¿está instalado? ¿hay red para npx?): ${err.message}`);
		return null;
	}
}

function main() {
	const registry = JSON.parse(readFileSync(MATURITY_PATH, "utf8"));
	const skillNames = Object.keys(registry.skills ?? {});
	if (skillNames.length === 0) {
		console.log("No hay skills registradas en foundry/maturity.json. Nada que revisar.");
		return;
	}

	const lastReview = lastReviewDate();
	const cutoffMs = lastReview ? new Date(lastReview).getTime() : 0;
	const periodLabel = lastReview ? `desde la última revisión (${lastReview})` : "desde siempre (primera revisión)";

	console.log(`Revisión mensual — ${today()}`);
	console.log(`Período: ${periodLabel}\n`);

	const skillkitData = runSkillkit();
	const countByName = new Map(
		(skillkitData?.top_skills ?? []).map((s) => [s.name, s.total]),
	);

	const rows = skillNames.map((name) => {
		const newCases = filesNewerThan(CASES_DIR, cutoffMs).filter((f) => f.includes(`/${name}-`) || f.includes(`cases/${name}.md`));
		const newRuns = filesNewerThan(join(RUNS_DIR, name), cutoffMs);
		return {
			name,
			channel: registry.skills[name].channel,
			maturity: registry.skills[name].maturity,
			count90d: countByName.get(name) ?? 0,
			newCases,
			newRuns,
		};
	});

	const withNewEvidence = rows.filter((r) => r.newCases.length > 0 || r.newRuns.length > 0);
	const withCountNoEvidence = rows.filter((r) => r.count90d > 0 && r.newCases.length === 0 && r.newRuns.length === 0);

	for (const r of rows) {
		console.log(
			`  ${r.name.padEnd(32)} canal=${r.channel.padEnd(11)} madurez=${r.maturity.padEnd(12)} skillkit(90d)=${r.count90d}` +
				(r.newCases.length || r.newRuns.length ? `  <- ${r.newCases.length} caso(s), ${r.newRuns.length} run(s) nuevos` : ""),
		);
	}

	const n = nextRoundNumber();
	const slug = `${String(n).padStart(3, "0")}-revision-mensual-${today()}`;
	const roundDir = join(ROUNDS_DIR, slug);
	const lines = [];
	lines.push(`# Ronda ${String(n).padStart(3, "0")}: Revisión mensual (${today()})`);
	lines.push("");
	lines.push("Status: propuesto, a la espera de tu decisión");
	lines.push(`Fecha: ${today()}`);
	lines.push(`Alcance: las ${skillNames.length} skills registradas en foundry/maturity.json, período ${periodLabel}`);
	lines.push("");
	lines.push("## Método");
	lines.push("");
	lines.push(
		"Generado por `scripts/monthly-review.mjs`: conteo de invocaciones vía `skillkit stats --all --days 90 --json`, cruzado contra archivos nuevos en `foundry/cases/` y `foundry/runs/<skill>/` desde la última revisión. Ver `foundry/skillkit-integration.md` para la disciplina de por qué un conteo solo no es evidencia.",
	);
	lines.push("");
	lines.push("## Estado por skill");
	lines.push("");
	lines.push("| Skill | Canal | Madurez | SkillKit (90d) | Evidencia nueva |");
	lines.push("|---|---|---|---:|---|");
	for (const r of rows) {
		const evidencia =
			r.newCases.length || r.newRuns.length
				? [...r.newCases, ...r.newRuns].map((f) => `\`${f}\``).join(", ")
				: "ninguna";
		lines.push(`| \`${r.name}\` | ${r.channel} | ${r.maturity} | ${r.count90d} | ${evidencia} |`);
	}
	lines.push("");
	if (withNewEvidence.length) {
		lines.push("## Con evidencia nueva — revisar si amerita proponer un cambio");
		lines.push("");
		for (const r of withNewEvidence) {
			lines.push(`- **\`${r.name}\`**: ${r.newCases.length} caso(s), ${r.newRuns.length} run(s) nuevos desde la última revisión.`);
		}
		lines.push("");
	}
	if (withCountNoEvidence.length) {
		lines.push("## Conteo de SkillKit sin evidencia registrada — solo señal de adopción, no promueve nada por sí sola");
		lines.push("");
		for (const r of withCountNoEvidence) {
			lines.push(`- \`${r.name}\`: ${r.count90d} invocaciones en 90d, sin caso ni run registrado. Si de verdad se usó sobre trabajo real, registrar el run/caso correspondiente antes de la próxima revisión.`);
		}
		lines.push("");
	}
	lines.push("## Decisión");
	lines.push("");
	lines.push("_Pendiente — completar después de revisar con el usuario. Si nada amerita cambio, dejar constancia explícita de \"sin cambios\" en vez de borrar esta ronda._");
	lines.push("");

	mkdirSync(roundDir, { recursive: true });
	writeFileSync(join(roundDir, "README.md"), `${lines.join("\n")}\n`);
	writeFileSync(LAST_REVIEW_PATH, `${today()}\n`);

	console.log(`\nBorrador escrito en foundry/rounds/${slug}/README.md`);
	console.log("Este script no comitea ni pushea — revisalo, completá la sección Decisión, y comiteá vos (o pedímelo en la sesión).");
}

main();
