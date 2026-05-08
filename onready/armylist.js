const { EmbedBuilder } = require("discord.js");
const config = require("../../config");
const { logLine } = require("../../utils/logger");
const SampQuery = require("node-samp-query");
const { normalizeName, buildArmyMap, sortArmyPlayers, fetchArmyRanks } = require("../../utils/armyfunctions");



const samp = new SampQuery({
	ip: config.scripts.armylist.IP,
	port: config.scripts.armylist.Port || 7777,
});

const MAX_PLAYERS = 101;

let statsMessage;



module.exports = {
	name: "clientReady",
	once: true,
	async execute(client) {
		if (!config.scripts.armylist.enable) {
			logLine("Army list is disabled in the config.");
			return;
		}

		const statusChannel = await client.channels
			.fetch(config.scripts.armylist.channel)
			.catch(() => null);

		if (!statusChannel) {
			logLine("❌ Armylist channel not found.");
			process.exit(1);
		}

		const messages = await statusChannel.messages.fetch({ limit: 10 }).catch(() => []);
		statsMessage = messages.find((m) => m.author.id === client.user.id);

		const payload = {
			embeds: [await createStatusEmbed()],
			components: [],
		};

		if (!statsMessage) {
			statsMessage = await statusChannel.send(payload);
		} else {
			await statsMessage.edit(payload);
		}

		setInterval(async () => {
			try {
				await updateArmylist();
			} catch (error) {
				console.error("❌ Error updating Armylist:", error);
			}
		}, config.scripts.armylist.Cooldown);

		logLine("Script Loaded", "Loaded Armylist.");

		async function updateArmylist() {
			const embed = await createStatusEmbed();

			if (statsMessage) {
				await statsMessage.edit({ embeds: [embed], components: [] });
			}
		}
	},
};


async function createStatusEmbed() {
	let isOnline = true;
	let playerList = [];

	try {
		playerList = await samp.getServerPlayers();
	} catch {
		isOnline = false;
	}

	const dt = new Date();

	let description =
		`**Server IP:** play.ls-rcr.com:7777\n\n` +
		`**Status:** ${isOnline ? "Online" : "Offline"}\n\n` +
		`**Players:** ${isOnline ? `${playerList.length}/${MAX_PLAYERS}` : `0/${MAX_PLAYERS}`}`;

	if (!isOnline) {
		return new EmbedBuilder()
		.setColor("800080")
		.setThumbnail("https://cdn.discordapp.com/attachments/1502245126192238622/1502261513350807652/Logo.png?ex=69ff118f&is=69fdc00f&hm=2b7667d1548dbc8081bd51c82a9af90f1a6e0b33e5d11753982c8d83162e0732&")
			.setDescription(description)
			.setFooter({
				text: `Last updated: [${config.scripts.armylist.Cooldown / 1000}s] ${dt.toUTCString()}`,
			});
	}

	description += `\n\n### Online Army Members:\n\n`;

	const sortedPlayers = [...playerList];

	const armyRanks = await fetchArmyRanks();
	const armyMap = buildArmyMap(armyRanks);
	const rankOrder = armyRanks.map((r) => r.rank);
    
	const armyPlayers = sortedPlayers.filter((p) =>
		armyMap.has(normalizeName(p.name))
	);
	

	if (armyPlayers.length === 0) {
		description += "*No Army members are currently online.*";
	} else {
		const sortedArmy = sortArmyPlayers(armyPlayers, rankOrder, armyMap);

		sortedArmy.forEach((p, i) => {
			const rank = armyMap.get(normalizeName(p.name)) || "-";
			description += `${i + 1}. *${p.name}* - ${rank}\n`;
		});
	}

	return new EmbedBuilder()
		.setColor("800080")
		.setThumbnail("https://cdn.discordapp.com/attachments/1502245126192238622/1502261513350807652/Logo.png?ex=69ff118f&is=69fdc00f&hm=2b7667d1548dbc8081bd51c82a9af90f1a6e0b33e5d11753982c8d83162e0732&")
		.setDescription(description)
		.setFooter({
			text: `Last updated: [${config.scripts.armylist.Cooldown / 1000}s] ${dt.toUTCString()}`,
		});
}