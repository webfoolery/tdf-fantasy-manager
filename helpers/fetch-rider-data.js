// RUN THIS SCRIPT IN THE CONSOLE OF THE FANTASY TDF WEBSITE TO DOWNLOAD CLEANED RIDER DATA
// CHECK EXISTING REQUEST
// ADD CURRENT TOKEN TO AUTHORIZATION HEADER

async function downloadTdfRidersClean(pageSize = 200) {
  const response = await fetch("https://fantasybytissot.letour.fr/v1/private/searchjoueurs?lg=en", {
    method: "POST",
    credentials: "include",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "authorization": "Token ------------INSERT TOKEN HERE---------------",
      "x-access-key": "------------INSERT ACCESS KEY HERE---------------"
    },
    body: JSON.stringify({
      filters: {
        nom: "",
        club: "",
        position: "",
        budget_ok: false,
        valeur_max: 27,
        engage: false,
        partant: false,
        dreamteam: false,
        quota: "",
        idj: "------------INSERT IDJ HERE---------------",
        pageIndex: 0,
        pageSize,
        loadSelect: 0,
        searchonly: 1
      }
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();

  const cleaned = {
    joueurs: (data.joueurs || []).map(rider => ({
      id: rider.id,
      nomcomplet: rider.nomcomplet,
      position: rider.position,
      club: rider.club,
      imageclub: rider.imageclub,
      bib: rider.bib,
      valeur: rider.valeur,
      date_match: rider.date_match
    }))
  };

  const blob = new Blob([JSON.stringify(cleaned, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tdf-riders-clean-${cleaned.joueurs.length}.json`;
  a.click();
  URL.revokeObjectURL(url);

  console.log(`Downloaded ${cleaned.joueurs.length} cleaned riders`);
  return cleaned;
}

downloadTdfRidersClean();