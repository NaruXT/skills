#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const SKILLS_DIR = "skills";
const MATURITY_STATES = new Set([
	"experimental",
	"dogfooded",
	"evaluated",
	"validated",
	"deprecated",
]);
const DISTRIBUTION_CHANNELS = new Set(["stable", "candidate", "experimental"]);
const MAX_SKILL_LINES = 500;
const errors = [];
const warnings = [];

function parseFrontmatter(text) {
	if (!text.startsWith("---")) return null;
	const end = text.indexOf("\n---", 3);
	if (end === -1) return null;
	const block = text.slice(3, end).trim();
	const keys = {};
	for (const line of block.split("\n")) {
		const match = line.match(/^([a-zA-Z0-9_-]+):/);
		if (match) keys[match[1]] = line.slice(match[0].length).trim();
	}
	return keys;
}

function markdownFiles(root) {
	if (!existsSync(root)) return [];
	return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
		if (entry.isDirectory() && entry.name === "node_modules") return [];
		const path = join(root, entry.name);
		if (entry.isDirectory()) return markdownFiles(path);
		return entry.name.endsWith(".md") ? [path] : [];
	});
}

function markdownLinkTargets(text) {
	// Ignorar spans de código en línea (`...`) y bloques ```...``` — un link
	// mostrado como ejemplo de código no es un link real de este repo.
	const withoutCode = text
		.replace(/```[\s\S]*?```/g, "")
		.replace(/`[^`\n]*`/g, "");
	const targets = [];
	const re = /\[[^\]]*\]\(([^)]+)\)/g;
	let match;
	while ((match = re.exec(withoutCode))) targets.push(match[1]);
	return targets;
}

function discoverSkills() {
	const entries = [];
	for (const entry of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
		if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
		const root = join(SKILLS_DIR, entry.name);
		if (existsSync(join(root, "SKILL.md"))) {
			entries.push({ name: entry.name, root, physical: "stable" });
		}
	}
	const experimentalContainer = join(SKILLS_DIR, ".experimental");
	if (existsSync(experimentalContainer)) {
		for (const entry of readdirSync(experimentalContainer, {
			withFileTypes: true,
		})) {
			if (!entry.isDirectory()) continue;
			const root = join(experimentalContainer, entry.name);
			if (existsSync(join(root, "SKILL.md"))) {
				entries.push({
					name: entry.name,
					root,
					physical: ".experimental",
				});
			}
		}
	}
	return entries;
}

function validateLinks(file) {
	const text = readFileSync(file, "utf8");
	for (const target of markdownLinkTargets(text)) {
		if (/^(https?:|mailto:|#)/.test(target)) continue;
		const path = resolve(dirname(file), target.split("#")[0]);
		if (!existsSync(path)) errors.push(`${file}: link roto a "${target}"`);
	}
}

function validateCase(file) {
	const text = readFileSync(file, "utf8");
	const required = ["- Skill:", "- Fecha:", "## Qué se hizo", "## Resultado"];
	for (const field of required) {
		if (!text.includes(field)) {
			errors.push(`${file}: falta la sección/campo "${field}"`);
		}
	}
	if (/\/Users\/[a-zA-Z0-9_-]+/.test(text)) {
		errors.push(`${file}: contiene una ruta local absoluta (/Users/...)`);
	}
}

// --- discovery ---

if (!existsSync(SKILLS_DIR)) {
	console.error(`No existe el directorio ${SKILLS_DIR}/.`);
	process.exit(1);
}

const skills = discoverSkills();
const names = skills.map((skill) => skill.name);

if (skills.length === 0) errors.push("No se encontró ninguna skill bajo skills/.");
if (new Set(names).size !== names.length) {
	errors.push("Hay nombres de skill repetidos entre stable y experimental.");
}

// --- maturity.json consistency ---

const maturityPath = join("foundry", "maturity.json");
if (!existsSync(maturityPath)) {
	errors.push("Falta foundry/maturity.json.");
} else {
	try {
		const maturity = JSON.parse(readFileSync(maturityPath, "utf8"));
		const registered = Object.keys(maturity.skills ?? {});
		for (const skill of skills) {
			const entry = maturity.skills?.[skill.name];
			if (!entry) {
				errors.push(`${skill.name}: sin entrada en foundry/maturity.json`);
				continue;
			}
			if (!MATURITY_STATES.has(entry.maturity)) {
				errors.push(`${skill.name}: estado de madurez inválido "${entry.maturity}"`);
			}
			if (!entry.type || !entry.summary) {
				errors.push(`${skill.name}: la entrada necesita "type" y "summary"`);
			}
			if (!DISTRIBUTION_CHANNELS.has(entry.channel)) {
				errors.push(`${skill.name}: canal inválido "${entry.channel}"`);
			}
			if (skill.physical === "stable" && entry.channel !== "stable") {
				errors.push(
					`${skill.name}: vive en skills/<nombre> plano, así que su canal debe ser "stable" (es "${entry.channel}")`,
				);
			}
			if (
				skill.physical === ".experimental" &&
				!["candidate", "experimental"].includes(entry.channel)
			) {
				errors.push(
					`${skill.name}: vive en skills/.experimental/, así que su canal debe ser "candidate" o "experimental" (es "${entry.channel}")`,
				);
			}
		}
		for (const name of registered) {
			if (!names.includes(name)) {
				errors.push(`foundry/maturity.json registra "${name}" pero esa skill no existe en el filesystem`);
			}
		}
	} catch {
		errors.push("foundry/maturity.json está mal formado.");
	}
}

// --- per-skill checks ---

for (const { name: dir, root } of skills) {
	const skillPath = join(root, "SKILL.md");
	const skill = readFileSync(skillPath, "utf8");
	const frontmatter = parseFrontmatter(skill);
	if (!frontmatter) {
		errors.push(`${dir}: falta el bloque de frontmatter o está mal formado`);
		continue;
	}
	for (const key of ["name", "description"]) {
		if (!frontmatter[key]) errors.push(`${dir}: al frontmatter le falta "${key}"`);
	}
	if (frontmatter.name && frontmatter.name !== dir) {
		errors.push(`${dir}: frontmatter name "${frontmatter.name}" != nombre de carpeta "${dir}"`);
	}
	const lineCount = skill.split("\n").length;
	if (lineCount > MAX_SKILL_LINES) {
		warnings.push(
			`${dir}: SKILL.md tiene ${lineCount} líneas (límite recomendado ${MAX_SKILL_LINES}) — considerá mover detalle a references/`,
		);
	}
}

// --- links y casos ---

for (const file of ["README.md", ...markdownFiles("skills"), ...markdownFiles("foundry")]) {
	validateLinks(file);
}

for (const file of markdownFiles(join("foundry", "cases")).filter(
	(file) => basename(file) !== "README.md",
)) {
	validateCase(file);
}

// --- report ---

if (warnings.length) {
	console.warn(`⚠ ${warnings.length} advertencia(s):\n${warnings.map((w) => `  - ${w}`).join("\n")}`);
}

if (errors.length) {
	console.error(`✗ Validación de skills falló:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
	process.exit(1);
}

console.log(`✓ ${skills.length} skill(s) válidas.`);
