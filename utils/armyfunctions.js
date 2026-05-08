const axios = require("axios");
const cheerio = require("cheerio");

let armyCache = {
	data: null,
	lastFetch: 0,
	cacheTime: 60 * 1000,
};

async function fetchArmyRanks() {
	const now = Date.now();

	if (armyCache.data && now - armyCache.lastFetch < armyCache.cacheTime) {
		return armyCache.data;
	}

	const { data } = await axios.get("https://ls-rcr.com/army/");
	const $ = cheerio.load(data);

	const ranks = [];

	$(".card.card-spacing").each((_, el) => {
		const title = $(el).find(".card-title").text().trim();
		const short = $(el).find(".card-subtitle").text().trim();

		if (!title) return;

		const rankName = title.replace(/\d+/g, "").trim();

		const members = [];
		$(el)
			.find(".list-group-item")
			.each((_, li) => {
				const name = $(li).text().trim();
				if (name) members.push(name);
			});

		ranks.push({
			rank: rankName,
			short,
			members,
		});
	});

	armyCache = {
		data: ranks,
		lastFetch: now,
	};

	return ranks;
}

function normalizeName(name) {
	return name
		.toLowerCase()
		.replace(/\[lsrcr\]/gi, "") // remove lsrcr tag 
		.replace(/\s+/g, "")   // remove spaces
		.trim();
}
function buildArmyMap(ranks) {
	const map = new Map();

	for (const rank of ranks) {
		for (const name of rank.members) {
			map.set(normalizeName(name), rank.rank);
		}
	}
	return map;
}

function sortArmyPlayers(players, rankOrder, armyMap) {
	const rankIndex = (playerName) => {
		const idx = rankOrder.indexOf(armyMap.get(normalizeName(playerName)));
		return idx;
	};
	return [...players].sort((a, b) => rankIndex(a.name) - rankIndex(b.name));
} 

module.exports = {
  fetchArmyRanks,
  sortArmyPlayers,
  buildArmyMap,
  normalizeName
};