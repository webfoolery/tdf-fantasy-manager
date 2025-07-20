/*
TODO::
import/export local storage to different machine
*/

document.addEventListener('DOMContentLoaded', function () {
	const LOCAL_STORAGE_TEAM = 'selectedRiderTeam';
	const LOCAL_STORAGE_ABANDONS = 'abandons';
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
	let copyTeamDestination = null;
	const riderFilterInput = document.getElementById('riderFilterInput');
	const riderFilterClearBtn = document.getElementById('riderFilterClearBtn');
	const riderListTable = document.getElementById('riderListTable');
	const riderListTbody = document.querySelector('#riderListTable tbody');
	const infoWrapper = document.querySelector('.infoWrapper');
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
	const copyResultMsg = document.getElementById('copyResultMsg');
	let abandonIds = loadAbandonedRiders();
	let loadedTeamIds = loadSelectedRiders();
	if (!Array.isArray(loadedTeamIds) || loadedTeamIds.length === 0) {
		currentSelectedRiderIds = [];
	} else {
		currentSelectedRiderIds = loadedTeamIds;
	}
	if (localStorage.getItem('returnVisit') != 'true') {
		document.body.classList.remove('hideInfo');
		localStorage.setItem('returnVisit', 'true');
	}

	data.joueurs.forEach((rider) => {
		count++;
		const row = document.createElement('tr');
		row.id = `rider${rider.id}`;
		row.classList.add(rider.position);
		if (abandonIds.indexOf(rider.id) != -1) row.classList.add('abandoned');

		// FIX LONG WORDS THAT BREAK LAYOUT!
		if (rider.club == 'TotalEnergies') rider.club = 'Total Energies';
		if (rider.nomcomplet.includes('SINTMAARTENSDIJK')) rider.nomcomplet = rider.nomcomplet.replace('SINTMAARTENSDIJK', 'SINTMRTNSDJK');

		const cellsData = {
			riderName: rider.nomcomplet,
			riderRole: rolesMap[rider.position],
			team: `<img src="images/teams/${rider.imageclub}" width="20px" alt="${rider.club}" title="ID ${rider.id}"> ${rider.club}`,
			riderBib: rider.bib,
			riderCost: `${rider.valeur}<img src="images/monnaie.png" />`
		};
		Object.keys(cellsData).forEach(key => {
			const td = document.createElement('td');
			td.classList.add(key);
			if (typeof cellsData[key] === 'string') td.innerHTML = cellsData[key];
			else td.textContent = cellsData[key];
			row.appendChild(td);
		});

		fragment.appendChild(row);
	});
	riderListTbody.appendChild(fragment);
	updateSelectedRiders(currentSelectedRiderIds)




	/*----------------------*/
	/* ------ EVENTS ------ */
	/*----------------------*/

	// CLICK TO SELECT/DESELECT RIDERS
	riderListTbody.addEventListener('click', (event) => {
		const clickedRow = event.target.closest('tr');
		if (clickedRow) {
			if (document.body.classList.contains('manageAbandons')) {
				if (clickedRow.classList.contains('abandoned')) removeAbandon(clickedRow);
				else addAbandon(clickedRow);
			}
			else {
				if (clickedRow.classList.contains('highlight')) removeSelected(clickedRow);
				else addSelected(clickedRow);
			}
		}
	});

	// TABLE HEADER CLICK TO TRIGGER COLUMN SORTS
	document.querySelectorAll('table.sortable th').forEach((th) => {
		th.addEventListener('click', (e) => {
			sortTable(e.target.closest('th')); //  CLOSEST IN CASE THE SORT INDICATOR IS CLICKED
		});
	});

	// CLOSE INFO PANEL
	document.getElementById('closeInfo').addEventListener('click', (e) => {
		document.body.classList.add('hideInfo');
	});

	// TOGGLE INFO PANEL
	document.getElementById('infoBtn').addEventListener('click', (e) => {
		document.body.classList.toggle('hideInfo');
		infoWrapper.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
	});

	// TRIGGER FILTER ON RIDER LIST
	riderFilterInput.addEventListener('input', filterTable);

	// CLEAR FILTER ON RIDER LIST
	riderFilterClearBtn.addEventListener('click', () => {
		riderFilterInput.value = '';
		filterTable();
	});

	// SELECT DIFFERENT RIDER SLOT
	document.querySelectorAll('.slotWrapper button').forEach((btn) => {
		btn.addEventListener('click', () => {
			changeActiveSlot(btn.dataset.team);
		});
	});

	// MANAGE MODAL CLOSES (ICON)
	document.querySelectorAll('.modalClose').forEach(el => {
		el.addEventListener('click', function (e) {
			el.closest('.modalOpen').classList.remove('modalOpen');
		});
	});

	// MANAGE MODAL CLOSES (OUTSIDE AREA)
	document.querySelectorAll('.modal').forEach(el => {
		el.addEventListener('click', function (e) {
			if (e.target.classList.contains('modalOpen')) {
				e.target.classList.remove('modalOpen');
			}
		});
	});

	// COPY SLOT MODAL TRIGGER
	document.getElementById('copySlot').addEventListener('click', (e) => {
		copyResultMsg.classList.remove('error', 'success');
		copyResultMsg.innerHTML = '';
		document.getElementById('selectedTeamSlot').innerText = currentSlot;
		document.getElementById('copyModal').classList.add('modalOpen');
	});

	document.querySelectorAll('.copyTeamDestination').forEach(el => {
		el.addEventListener('click', function (e) {
			copyTeamDestination = el.dataset.slot;
			let currentlySelectedDestination = document.querySelector('.copyTeamDestination.active');
			if (currentlySelectedDestination) currentlySelectedDestination.classList.remove('active');
			el.classList.add('active');
			document.getElementById('copyTeamExecute').disabled = false;
		});
	});

	document.getElementById('copyTeamExecute').addEventListener('click', (e) => {
		if (copyTeamDestination == null) {
			copyResultMsg.classList.add('error');
			copyResultMsg.innerHTML = `<p>You must select a slot first<p>`;
			return false;
		}
		let currentTeam = loadSelectedRiders();
		currentSlot = copyTeamDestination;
		saveSelectedRiders(currentTeam);
		changeActiveSlot(copyTeamDestination);
		copyResultMsg.classList.add('success');
		document.getElementById('copyResultMsg').innerHTML = `<p>Your team has been copied to slot ${copyTeamDestination}.<br>Click here to close this window.<p>`;
		document.querySelector('.copyTeamDestination.active').classList.remove('active');
		copyTeamDestination = null;
	});

	// MANAGE ABANDONED RIDER LIST
	document.getElementById('removeRider').addEventListener('click', (e) => {
		document.body.classList.toggle('manageAbandons');
	});

	document.getElementById('abandonInfo').addEventListener('click', (e) => {
		document.body.classList.remove('manageAbandons');
	});




	/*-------------------------*/
	/* ------ FUNCTIONS ------ */
	/*-------------------------*/

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
		if (currentSelectedRiderIds) {
			currentSelectedRiderIds.forEach(riderId => {
				const row = document.getElementById(`rider${riderId}`);
				if (row) {
					addSelected(row, true);
				}
			});
		}
		updateTeamStatsDisplay();
	}

	function addAbandon(row) {
		const riderId = parseInt(row.id.replace('rider', ''), 10);
		row.classList.add('abandoned');
		selectedAbandonedRider = document.getElementById('selected' + riderId);
		if (selectedAbandonedRider) selectedAbandonedRider.classList.add('abandoned');
		abandonIds.push(riderId);
		saveAbandonedRiders(abandonIds);
	}

	function removeAbandon(row) {
		const riderId = parseInt(row.id.replace('rider', ''), 10);
		row.classList.remove('abandoned');
		selectedAbandonedRider = document.getElementById('selected' + riderId);
		if (selectedAbandonedRider) selectedAbandonedRider.classList.remove('abandoned');
		abandonIds = abandonIds.filter(id => id !== riderId);
		saveAbandonedRiders(abandonIds);
	}

	function saveAbandonedRiders(riderIds) {
		try {
			localStorage.setItem(LOCAL_STORAGE_ABANDONS, JSON.stringify(riderIds));
		} catch (e) {
			console.error("Error saving abandons to localStorage:", e);
		}
	}

	function loadAbandonedRiders() {
		try {
			const abandonIds = localStorage.getItem(LOCAL_STORAGE_ABANDONS);
			if (abandonIds) {
				return JSON.parse(abandonIds).map(id => parseInt(id, 10));
			}
			else {
				return [];
			}
		} catch (e) {
			console.error("Error loading abandons from localStorage:", e);
			return [];
		}
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
		clonedRow.style.display = ''; // OTHERWISE WHEN FILTERED SOME ROWS WILL BE HIDDEN!
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
			const riderName = row.querySelector('.riderName')?.textContent.toLowerCase() || '';
			const riderRole = row.querySelector('.riderRole')?.textContent.toLowerCase() || '';
			const teamName = row.querySelector('.team')?.textContent.toLowerCase() || ''; // Text content will strip image
			const riderBib = row.querySelector('.riderBib')?.textContent.toLowerCase() || '';
			const riderCost = row.querySelector('.riderCost')?.textContent.toLowerCase().replace(/[^\d.]/g, '') || ''; // Remove currency symbol for numeric search
			const isMatch = riderName.includes(filterText) ||
				riderRole.includes(filterText) ||
				teamName.includes(filterText) ||
				riderBib.includes(filterText) ||
				riderCost.includes(filterText);
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
			noRidersEl.style.display = '';
			selectedRidersTable.style.display = 'table';
		}
		else {
			noRidersEl.style.display = 'block';
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
		if (currentTeamLeaders > 3) leaderEl.classList.add('error');
		else leaderEl.classList.remove('error');
		if (currentTeamClimbers > 3) climberEl.classList.add('error');
		else climberEl.classList.remove('error');
		if (currentTeamSprinters > 3) sprinterEl.classList.add('error');
		else sprinterEl.classList.remove('error');
		if (currentTeamAllrounders > 5) allrounderEl.classList.add('error');
		else allrounderEl.classList.remove('error');
	}

	function changeActiveSlot(slot) {
		currentSlot = slot;
		document.querySelector('.slotActive').classList.remove('slotActive');
		document.getElementById('slot' + slot).classList.add('slotActive');
		currentSelectedRiderIds = loadSelectedRiders();
		updateSelectedRiders(currentSelectedRiderIds);
	}

	function saveSelectedRiders(riderIds) {
		try {
			localStorage.setItem(LOCAL_STORAGE_TEAM + currentSlot, JSON.stringify(riderIds));
		} catch (e) {
			console.error("Error saving to localStorage:", e);
		}
	}

	function loadSelectedRiders() {
		try {
			const storedTeam = localStorage.getItem(LOCAL_STORAGE_TEAM + currentSlot);
			if (storedTeam) {
				return JSON.parse(storedTeam).map(id => parseInt(id, 10));
			}
			else {
				return [];
			}
		} catch (e) {
			console.error("Error loading from localStorage:", e);
			return [];
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
		clickedHeader.innerHTML = clickedHeader.textContent + `<span class="sortIndicator">${indicator}</span>`;
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
		if (table.id === 'selectedRidersTable') {
			const sortedSelectedRiderIds = rows.map(row => {
				// Extract the numeric ID from the row's ID (e.g., "selected123" -> 123)
				return parseInt(row.id.replace('selected', ''), 10);
			});
			// Update the global state array
			currentSelectedRiderIds = sortedSelectedRiderIds;
			// Save the updated, sorted array to localStorage
			saveSelectedRiders(currentSelectedRiderIds);
		}
	}

}); // END OF DOMContentLoaded
