
/*
TODO::
Filter for all rider list
3x slots for different team configs

*/
const startingTeam = [];
const abandons = [264, 352, 14, 98, 328, 387, 177];
const LOCAL_STORAGE_KEY = 'selectedRiderTeam';
const rolesMap = {
	lib_rouleur: 'All rounder',
	lib_grimpeur: 'Climber',
	lib_baroudeur: 'Sprinter',
	lib_leader: 'Leader',
	abandoned: 'Abandoned',
};
let count = 0;
let currentSlot = 1;
let currentTeamCost = 0;
let currentTeamCount = 0;
let currentTeamLeaders = 0;
let currentTeamSprinters = 0;
let currentTeamClimbers = 0;
let currentTeamAllrounders = 0;
let currentSelectedRiderIds = [];


document.addEventListener('DOMContentLoaded', function () {
	const riderFilterInput = document.getElementById('riderFilterInput');
	const riderFilterClearBtn = document.getElementById('riderFilterClearBtn');
	const riderListTable = document.getElementById('riderListTable');
	const riderListTbody = document.querySelector('#riderListTable tbody');
	const selectedRidersTable = document.getElementById('selectedRidersTable');
	const selectedRidersTbody = document.querySelector('#selectedRidersTable tbody');
	const noRidersEl = document.getElementById('noRidersSelected');
	const teamCostEl = document.getElementById('teamCost');
	const teamCountEl = document.getElementById('teamCount');
	const teamleaderEl = document.getElementById('teamLeaders');
	const teamsprinterEl = document.getElementById('teamSprinters');
	const teamclimberEl = document.getElementById('teamClimbers');
	const teamallrounderEl = document.getElementById('teamAllrounders');
	const fragment = document.createDocumentFragment();

	data.joueurs.forEach((rider) => {
		count++;
		const row = document.createElement('tr');
		row.id = `rider${rider.id}`;
		row.classList.add(rider.position);
		if (startingTeam.indexOf(rider.id) != -1) row.classList.add('highlight');
		if (abandons.indexOf(rider.id) != -1) row.classList.add('abandoned');

		// SOME WORDS ARE TOO LONG & AFFECT LAYOUT!
		if (rider.club == 'TotalEnergies') rider.club = 'Total Energies';
		if (rider.nomcomplet.includes('SINTMAARTENSDIJK')) rider.nomcomplet = rider.nomcomplet.replace('SINTMAARTENSDIJK', 'SINTMRTNSDJK');

		const cellsData = {
			// count: count,
			// id: rider.id,
			riderName: rider.nomcomplet,
			riderRole: rolesMap[rider.position],
			team: `<img src="images/teams/${rider.imageclub}" width="20px" alt="${rider.club}" title="ID ${rider.id}"> ${rider.club}`,
			riderBib: rider.bib,
			riderCost: `${rider.valeur}<img src="images/monnaie.png" />`
		};
		Object.keys(cellsData).forEach(key => {
			const td = document.createElement('td');
			td.classList.add(key);
			if (typeof cellsData[key] === 'string' && cellsData[key].includes('<img')) td.innerHTML = cellsData[key];
			else td.textContent = cellsData[key];
			row.appendChild(td);
		});

		fragment.appendChild(row);
	});
	riderListTbody.appendChild(fragment);
	let loadedTeamIds = loadSelectedRiders();
	if (!Array.isArray(loadedTeamIds) || loadedTeamIds.length === 0) {
		// console.log("No saved team found in localStorage, using starting team.");
		currentSelectedRiderIds = [...startingTeam]; // Initialize with startingTeam
	} else {
		// console.log("Loaded team from localStorage:", loadedTeamIds);
		currentSelectedRiderIds = loadedTeamIds; // Use loaded team
	}
	// currentSelectedRiderIds.forEach(riderId => {
	// 	const row = document.getElementById(`rider${riderId}`);
	// 	if (row) {
	// 		addSelected(row, true); // This will add highlight, clone, update stats, and save to localStorage
	// 	}
	// });
	updateSelectedRiders(currentSelectedRiderIds)

	function updateSelectedRiders(currentSelectedRiderIds) {
		currentTeamCost = 0;
		currentTeamCount = 0;
		currentTeamLeaders = 0;
		currentTeamSprinters = 0;
		currentTeamClimbers = 0;
		currentTeamAllrounders = 0;
		selectedRidersTbody.querySelectorAll('table#selectedRidersTable tbody tr').forEach((tr) => {
			tr.remove();
		});
		riderListTbody.querySelectorAll('tr.highlight').forEach((tr) => {
			tr.classList.remove('highlight');
		});
		for (const header of selectedRidersTable.tHead.rows[0].cells) {
			const plainText = header.textContent.replace(/[\u25B2\u25BC]/g, "").trim();
			header.textContent = plainText;
			header.removeAttribute("data-sort-dir");
		}
		currentSelectedRiderIds.forEach(riderId => {
			const row = document.getElementById(`rider${riderId}`);
			if (row) {
				addSelected(row, true); // This will add highlight, clone, update stats, and save to localStorage
			}
		});
		updateTeamStatsDisplay();
	}

	function addSelected(row, init = false) {
		const riderId = parseInt(row.id.replace('rider', ''), 10);
		const rider = getObjectById(data.joueurs, riderId);
		if (!rider) {
			console.warn(`Rider with ID ${riderId} not found in data.`);
			return;
		}
		if (!init) {
			currentSelectedRiderIds.push(riderId);
			saveSelectedRiders(currentSelectedRiderIds);
		}
		row.classList.add('highlight');
		const clonedRow = row.cloneNode(true);
		clonedRow.classList.remove('highlight');
		clonedRow.id = `selected${rider.id}`;
		clonedRow.addEventListener("click", (event) => {
			removeSelected(document.getElementById(clonedRow.id.replace('selected', 'rider')));
		});
		selectedRidersTbody.appendChild(clonedRow);
		// UPDATE COSTS
		currentTeamCost += parseInt(rider.valeur);
		currentTeamCount++;
		if (rolesMap[rider.position] === 'All rounder') currentTeamAllrounders++;
		else if (rolesMap[rider.position] === 'Climber') currentTeamClimbers++;
		else if (rolesMap[rider.position] === 'Sprinter') currentTeamSprinters++;
		else if (rolesMap[rider.position] === 'Leader') currentTeamLeaders++;
		updateTeamStatsDisplay();
	}

	function removeSelected(row) {
		const riderId = parseInt(row.id.replace('rider', ''), 10);
		const rider = getObjectById(data.joueurs, riderId);
		if (!rider) {
			console.warn(`Rider with ID ${riderId} not found in data.`);
			return;
		}
		// Remove from current selected IDs list and save to localStorage
		currentSelectedRiderIds = currentSelectedRiderIds.filter(id => id !== riderId);
		saveSelectedRiders(currentSelectedRiderIds);
		row.classList.remove('highlight');
		document.getElementById('selected' + riderId).remove();
		// UPDATE COSTS
		currentTeamCost -= parseInt(rider.valeur);
		currentTeamCount--;
		if (rolesMap[rider.position] === 'All rounder') currentTeamAllrounders--;
		else if (rolesMap[rider.position] === 'Climber') currentTeamClimbers--;
		else if (rolesMap[rider.position] === 'Sprinter') currentTeamSprinters--;
		else if (rolesMap[rider.position] === 'Leader') currentTeamLeaders--;
		updateTeamStatsDisplay();
	}
	function filterTable() {
		const filterText = riderFilterInput.value.toLowerCase().trim();
		const allRiderRows = riderListTbody.querySelectorAll('tr');

		allRiderRows.forEach(row => {
			// Get text content from relevant cells by their class names
			const riderName = row.querySelector('.riderName')?.textContent.toLowerCase() || '';
			const riderRole = row.querySelector('.riderRole')?.textContent.toLowerCase() || '';
			const teamName = row.querySelector('.team')?.textContent.toLowerCase() || ''; // Text content will strip image
			const riderBib = row.querySelector('.riderBib')?.textContent.toLowerCase() || '';
			const riderCost = row.querySelector('.riderCost')?.textContent.toLowerCase().replace(/[^\d.]/g, '') || ''; // Remove currency symbol for numeric search

			// Check if any of the fields contain the filter text
			const isMatch = riderName.includes(filterText) ||
				riderRole.includes(filterText) ||
				teamName.includes(filterText) ||
				riderBib.includes(filterText) ||
				riderCost.includes(filterText);

			// Show/hide the row based on match
			row.style.display = isMatch ? '' : 'none';
		});
	}

	function updateTeamStatsDisplay() {
		teamCostEl.innerText = currentTeamCost;
		teamCountEl.innerText = currentTeamCount;
		teamleaderEl.innerText = currentTeamLeaders;
		teamsprinterEl.innerText = currentTeamSprinters;
		teamclimberEl.innerText = currentTeamClimbers;
		teamallrounderEl.innerText = currentTeamAllrounders;
		if (currentTeamCount > 0) {
			noRidersEl.style.display = 'none';
			selectedRidersTable.style.display = 'revert';
		}
		else {
			noRidersEl.style.display = 'revert';
			selectedRidersTable.style.display = 'none';
		}
		let costEl = teamCostEl.closest('div');
		let countEl = teamCountEl.closest('div');
		let leaderEl = teamleaderEl.closest('div');
		let sprinterEl = teamsprinterEl.closest('div');
		let climberEl = teamclimberEl.closest('div');
		let allrounderEl = teamallrounderEl.closest('div');
		if (currentTeamCost > 120) costEl.classList.add('error');
		else costEl.classList.remove('error');
		if (currentTeamCount != 8) countEl.classList.add('error');
		else countEl.classList.remove('error');
		// you cannot exceed 5 all-rounders, 3 climbers, 3 sprinters and 3 leaders in your squad
		if (currentTeamLeaders > 3) leaderEl.classList.add('error');
		else leaderEl.classList.remove('error');
		if (currentTeamClimbers > 3) climberEl.classList.add('error');
		else climberEl.classList.remove('error');
		if (currentTeamSprinters > 3) sprinterEl.classList.add('error');
		else sprinterEl.classList.remove('error');
		if (currentTeamAllrounders > 5) allrounderEl.classList.add('error');
		else allrounderEl.classList.remove('error');
	}

	// CLICK EVENT TO SELECT/DESELECT RIDERS
	riderListTbody.addEventListener('click', (event) => {
		const clickedRow = event.target.closest('tr');
		if (clickedRow && clickedRow.id.startsWith('rider')) {
			if (clickedRow.classList.contains('highlight')) removeSelected(clickedRow);
			else addSelected(clickedRow);
		}
	});

	// TABLE HEADER CLICK EVENT TO TRIGGER COLUMN SORTS
	document.querySelectorAll('table.sortable th').forEach((th) => {
		th.addEventListener('click', (e) => {
			sortTable(e.target);
		});
	});

	document.getElementById('closeInfo').addEventListener('click', (e) => {
		document.body.classList.add('hideInfo');
	});

	document.getElementById('infoBtn').addEventListener('click', (e) => {
		document.body.classList.toggle('hideInfo');
	});

	riderFilterInput.addEventListener('input', filterTable);

	riderFilterClearBtn.addEventListener('click', () => {
		riderFilterInput.value = ''; // Clear the input
		filterTable(); // Re-apply filter to show all rows
	});

	document.querySelectorAll('.slotWrapper button').forEach((btn) => {
		btn.addEventListener('click', () => {
			currentSlot = btn.dataset.team;
			document.querySelector('.slotActive').classList.remove('slotActive');
			btn.classList.add('slotActive');
			currentSelectedRiderIds = loadSelectedRiders();
			updateSelectedRiders(currentSelectedRiderIds)
		});
	});

	// document.getElementById('#slot1').addEventListener('click', (e) => {
	// 	currentSlot=1;
	// 	loadSelectedRiders();
	// });

	// document.getElementById('#slot2').addEventListener('click', (e) => {
	// 	currentSlot=2;
	// 	loadSelectedRiders();
	// });

	// document.getElementById('#slot3').addEventListener('click', (e) => {
	// 	currentSlot=3;
	// 	loadSelectedRiders();
	// });

});

function saveSelectedRiders(riderIds) {
	try {
		localStorage.setItem(LOCAL_STORAGE_KEY + currentSlot, JSON.stringify(riderIds));
	} catch (e) {
		console.error("Error saving to localStorage:", e);
	}
}

function loadSelectedRiders() {
	try {
		const storedTeam = localStorage.getItem(LOCAL_STORAGE_KEY + currentSlot);
		if (storedTeam) {
			document.body.classList.add('hideInfo');
			return JSON.parse(storedTeam);
		}
		else return null;
	} catch (e) {
		console.error("Error loading from localStorage:", e);
		return null;
	}
}

function getObjectById(arr, id) {
	return arr.find(obj => obj.id === id);
}

function sortTable(clickedHeader) {
	let columnIndex = clickedHeader.cellIndex;
	const table = clickedHeader.closest('table');
	const thead = table.tHead;
	const tbody = table.tBodies[0];
	const rows = Array.from(tbody.rows);
	const currentDir = clickedHeader.getAttribute("data-sort-dir") || "desc";
	const newDir = currentDir === "desc" ? "asc" : "desc";
	for (const header of thead.rows[0].cells) {
		const plainText = header.textContent.replace(/[\u25B2\u25BC]/g, "").trim();
		header.textContent = plainText;
		header.removeAttribute("data-sort-dir");
	}
	const indicator = newDir === "asc" ? "▲" : "▼";
	clickedHeader.innerHTML = clickedHeader.textContent + ` <span class="sort-indicator">${indicator}</span>`;
	clickedHeader.setAttribute("data-sort-dir", newDir);
	rows.sort((a, b) => {
		let valA = a.cells[columnIndex].textContent.trim().toLowerCase();
		let valB = b.cells[columnIndex].textContent.trim().toLowerCase();
		if (!isNaN(valA) && !isNaN(valB)) {
			valA = parseFloat(valA);
			valB = parseFloat(valB);
			return newDir === "asc" ? valA - valB : valB - valA;
		}
		return newDir === "asc"
			? valA.localeCompare(valB)
			: valB.localeCompare(valA);
	});
	rows.forEach(row => tbody.appendChild(row));
}
