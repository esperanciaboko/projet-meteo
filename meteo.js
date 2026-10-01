const formulaire = document.getElementById("rock");
const bouton = document.getElementById("button-addon2");
const input = document.getElementById("ville");
const carteMeteo = document.getElementById("bloc-meteo");
const toastElement = document.getElementById("toast-meteo");
const toastMessage = document.getElementById("toast-message");

// ============================================================
// 1. GÉOCODAGE via Nominatim (OpenStreetMap) — VERSION CORRIGÉE
// ============================================================
async function geocoder(saisie) {
    // On sépare la ville et le pays (si l'utilisateur a mis une virgule)
    const parties = saisie.split(",").map(p => p.trim());
    const villeSaisie = parties[0];
    const paysSaisi = parties[1] || null; // undefined si pas de virgule

    const url = `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(saisie)}` +
                `&format=json&limit=5&addressdetails=1`;

    const reponse = await fetch(url, {
        headers: {
            "Accept-Language": "fr",
            "User-Agent": "AppMeteo/1.0"
        }
    });

    if (!reponse.ok) throw new Error("Erreur de géocodage");

    const resultats = await reponse.json();
    if (!resultats.length) throw new Error("VILLE_INTROUVABLE");

    // ⭐ On privilégie les VRAIES villes
    const TYPES_VILLE = ["city", "town", "village", "municipality", "administrative"];
    const lieu = resultats.find(r =>
        TYPES_VILLE.includes(r.type) || TYPES_VILLE.includes(r.addresstype)
    );

    if (!lieu) throw new Error("PAS_UNE_VILLE");

    const a = lieu.address || {};
    const nomVille = a.city || a.town || a.village || a.municipality;
    if (!nomVille) throw new Error("PAS_UNE_VILLE");

    const paysTrouve = a.country || "Indisponible";

    // 🎯 VÉRIFICATION : si l'utilisateur a précisé un pays, il doit correspondre
    if (paysSaisi) {
        const normaliser = (t) => t.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[-_']/g, " ").trim();

        const paysSaisiNorm = normaliser(paysSaisi);
        const paysTrouveNorm = normaliser(paysTrouve);

        // Correspondance souple : l'un contient l'autre
        // (gère "USA" ↔ "United States of America", "RDC" ↔ "Democratic Republic of the Congo"…)
        const correspond = paysTrouveNorm.includes(paysSaisiNorm)
                       || paysSaisiNorm.includes(paysTrouveNorm);

        if (!correspond) {
            throw new Error(`PAYS_INCORRECT|${paysSaisi}|${paysTrouve}`);
        }
    }

    return {
        lat: lieu.lat,
        lon: lieu.lon,
        nom: nomVille,
        region: a.state || a.region || a.county || "Indisponible",
        pays: paysTrouve,
        complet: lieu.display_name
    };
}

// ============================================================
// 2. RÉCUPÉRATION MÉTÉO via wttr.in (par coordonnées)
// ============================================================
async function obtenirmeteo(ville) {
    // États du bouton
    const contenuOriginal = bouton.innerHTML;
    bouton.disabled = true;
    bouton.innerHTML = `<span class="spinner-border spinner-border-sm me-1 me-sm-2"></span>
                        <span class="d-none d-sm-inline">Recherche...</span>`;

    try {
        // 1️⃣ Géocodage précis
        const lieu = await geocoder(ville);

        // 2️⃣ Météo par coordonnées (fiable)
        const reponse = await fetch(
            `https://wttr.in/${lieu.lat},${lieu.lon}?format=j1`
        );
        if (!reponse.ok) throw new Error(`Erreur HTTP (code ${reponse.status})`);

        const donnees = await reponse.json();

        // 3️⃣ Infos fiables issues de Nominatim
        const country = lieu.pays;
        const area = lieu.region;
        const town = lieu.nom;

        const temp = donnees.current_condition?.[0]?.temp_C || "Indisponible";
        const cold = donnees.current_condition?.[0]?.humidity || "Indisponible";
        const wind = donnees.current_condition?.[0]?.windspeedKmph || "Indisponible";
        const description = donnees.current_condition?.[0]?.lang_fr?.[0]?.value
                         || donnees.current_condition?.[0]?.weatherDesc?.[0]?.value
                         || "Non disponible";

        // 🎯 Chance de pluie : on cherche l'heure actuelle dans hourly
        const heureActuelle = parseInt(donnees.current_condition?.[0]?.observation_time?.slice(0, 2) || "0", 10);
        const heureProche = donnees.weather?.[0]?.hourly?.reduce((prev, curr) => {
            const h = parseInt(curr.time / 100, 10);
            return Math.abs(h - heureActuelle) < Math.abs(parseInt(prev.time / 100, 10) - heureActuelle) ? curr : prev;
        });
        const luck = heureProche?.chanceofrain || "0";

        // 4️⃣ Affichage de la carte
        carteMeteo.innerHTML = `
            <div class="d-flex flex-column gap-3 gap-sm-3">

                <!-- Pays -->
                <div class="d-flex overflow-hidden align-items-stretch rounded-3 ms-2 me-2 ms-sm-2 me-sm-2">
                    <div class="row w-50 g-0 bg-info align-items-center p-2 p-sm-3">
                        <div class="col-3 text-center">
                            <i class="bi bi-globe-americas text-light fs-5"></i>
                        </div>
                        <div class="col-9 p-0">
                            <p class="subtitle text-light m-0">Pays:</p>
                        </div>
                    </div>
                    <div class="w-50 bg-light d-flex align-items-center justify-content-center p-2 p-sm-3">
                        <p class="text-info fw-semibold text-center m-0">${country}</p>
                    </div>
                </div>

                <!-- Région -->
                <div class="d-flex overflow-hidden align-items-stretch rounded-3 ms-1 me-1 ms-sm-2 me-sm-2">
                    <div class="row w-50 g-0 bg-info align-items-center p-2 p-sm-3">
                        <div class="col-3 text-center">
                            <i class="bi bi-map-fill text-light fs-5"></i>
                        </div>
                        <div class="col-9 p-0">
                            <p class="subtitle text-light m-0">Région:</p>
                        </div>
                    </div>
                    <div class="w-50 bg-light d-flex align-items-center justify-content-center p-2 p-sm-3">
                        <p class="text-info text-center fw-semibold m-0">${area}</p>
                    </div>
                </div>

                <!-- Ville -->
                <div class="d-flex overflow-hidden align-items-stretch rounded-3 ms-1 me-1 ms-sm-2 me-sm-2">
                    <div class="row w-50 g-0 bg-info align-items-center p-2 p-sm-3">
                        <div class="col-3 text-center">
                            <i class="bi bi-geo-alt-fill text-light fs-5"></i>
                        </div>
                        <div class="col-9 p-0">
                            <p class="subtitle text-light m-0">Ville:</p>
                        </div>
                    </div>
                    <div class="w-50 bg-light d-flex align-items-center justify-content-center p-2 p-sm-3">
                        <p class="text-info text-center fw-semibold m-0">${town}</p>
                    </div>
                </div>

                <!-- Température -->
                <div class="d-flex overflow-hidden align-items-stretch rounded-3 ms-1 me-1 ms-sm-2 me-sm-2">
                    <div class="row w-50 g-0 bg-info align-items-center p-2 p-sm-3">
                        <div class="col-3 text-center">
                            <i class="bi bi-thermometer-half text-light fs-5"></i>
                        </div>
                        <div class="col-9 p-0">
                            <p class="subtitle text-light m-0">Température:</p>
                        </div>
                    </div>
                    <div class="w-50 bg-light d-flex align-items-center justify-content-center p-2 p-sm-3">
                        <p class="text-info text-center fw-semibold m-0">${temp}${temp !== "Indisponible" ? "°C" : ""}</p>
                    </div>
                </div>

                <!-- Humidité -->
                <div class="d-flex overflow-hidden align-items-stretch rounded-3 ms-1 me-1 ms-sm-2 me-sm-2">
                    <div class="row w-50 g-0 bg-info align-items-center p-2 p-sm-3">
                        <div class="col-3 text-center">
                            <i class="bi bi-droplet text-light fs-5"></i>
                        </div>
                        <div class="col-9 p-0">
                            <p class="subtitle text-light m-0">Humidité:</p>
                        </div>
                    </div>
                    <div class="w-50 bg-light d-flex align-items-center justify-content-center p-2 p-sm-3">
                        <p class="text-info text-center fw-semibold m-0">${cold}${cold !== "Indisponible" ? "%" : ""}</p>
                    </div>
                </div>

                <!-- Vent -->
                <div class="d-flex overflow-hidden align-items-stretch rounded-3 ms-1 me-1 ms-sm-2 me-sm-2">
                    <div class="row w-50 g-0 bg-info align-items-center p-2 p-sm-3">
                        <div class="col-3 text-center">
                            <i class="bi bi-wind text-light fs-5"></i>
                        </div>
                        <div class="col-9 p-0">
                            <p class="subtitle text-light m-0">Vent:</p>
                        </div>
                    </div>
                    <div class="w-50 bg-light d-flex align-items-center justify-content-center p-2 p-sm-3">
                        <p class="text-info text-center fw-semibold m-0">${wind}${wind !== "Indisponible" ? "km/h" : ""}</p>
                    </div>
                </div>

                <!-- Description -->
                <div class="rounded-3 w-100 h-auto align-items-center justify-content-center" id="describe">
                    <p class="p-3 mb-0 fw-bold" id="describing">
                        Cette ville est sous la condition suivante: <strong>${description}</strong>
                        avec <strong>${luck}%</strong> de risque de pluie.
                    </p>
                </div>

                <!-- 📍 Localisation complète (transparence) -->
                <p class="text-muted text-center small mb-0 mt-1">
                    <i class="bi bi-pin-map me-1"></i>${lieu.complet}
                </p>
            </div>
        `;
        carteMeteo.classList.remove("d-none");

        // Toast succès
        toastElement.classList.remove("text-bg-warning");
        toastElement.classList.add("text-bg-success");
        const date = donnees.weather?.[0]?.date;
        const hour = donnees.current_condition?.[0]?.observation_time;
        toastMessage.innerHTML = date && hour
            ? `<i class="bi bi-check-circle-fill me-1"></i> Données du ${date} à ${hour} UTC`
            : `<i class="bi bi-check-circle-fill me-1"></i> Données météo récupérées avec succès`;
        bootstrap.Toast.getOrCreateInstance(toastElement, { delay: 3000 }).show();

    } catch (error) {
        // 🎯 Gestion fine des erreurs
        let titre = "Erreur";
        let message = "Veuillez vérifier le nom de la ville et réessayer.";
        let icone = "bi-exclamation-triangle-fill";

        if (error.message === "VILLE_INTROUVABLE") {
            titre = "Ville introuvable";
            message = `Aucun résultat pour « <strong>${ville}</strong> ».<br>
                       <span class="small">Vérifiez l'orthographe ou précisez votre demande
                       (ex : « ${ville}, France »).</span>`;
        } else if (error.message === "PAS_UNE_VILLE") {
            titre = "Précisez votre recherche";
            message = `« <strong>${ville}</strong> » ne correspond pas à une ville.<br>
                       <span class="small">Essayez avec le nom complet d'une ville
                       (ex : « Accra, Ghana » ou « Chicago, USA »).</span>`;
        } else if (error.message?.startsWith("Erreur HTTP")) {
            titre = "Service indisponible";
            message = "Le service météo est momentanément indisponible. Réessayez dans un instant.";
        
        } else if (error.message?.startsWith("PAYS_INCORRECT")) {
            const [, paysDemande, paysTrouve] = error.message.split("|");
            titre = "Pays incorrect";
            message = `Vous avez demandé « <strong>${ville}</strong> ».<br>
                    La ville a été trouvée en <strong>${paysTrouve}</strong>, 
                    pas en <strong>${paysDemande}</strong>.<br>
                    <span class="small">
                        Vérifiez le pays, ou relancez sans préciser le pays 
                        (ex : « ${ville.split(",")[0].trim()} »).
                    </span>`;
            icone = "bi-globe";
        }

        carteMeteo.innerHTML = `
            <div class="alert alert-warning d-flex align-items-start" role="alert">
                <i class="bi ${icone} fs-4 me-2 mt-1"></i>
                <div>
                    <strong>${titre}</strong><br>
                    ${message}
                </div>
            </div>
        `;
        carteMeteo.classList.remove("d-none");

        // Toast avertissement
        toastElement.classList.remove("text-bg-success");
        toastElement.classList.add("text-bg-warning");
        toastMessage.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-1"></i> ${titre}`;
        bootstrap.Toast.getOrCreateInstance(toastElement, { delay: 3000 }).show();

    } finally {
        // Restauration du bouton
        bouton.disabled = false;
        bouton.innerHTML = contenuOriginal;
    }
}

// ============================================================
// 3. ÉCOUTE DU FORMULAIRE
// ============================================================
formulaire.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value.trim() !== "") {
        obtenirmeteo(input.value.trim());
    }
});