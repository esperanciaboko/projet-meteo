const formulaire = document.getElementById("rock");
const bouton = document.getElementById("button-addon2");
const input = document.getElementById("ville");
const carteMeteo = document.getElementById("bloc-meteo");

async function obtenirmeteo(ville) {

    try {
        const reponse = await fetch(`https://wttr.in/${encodeURIComponent(ville)}?format=j1`);
                
        if (!reponse.ok) {
            throw new Error (`Erreur HTTP (code ${reponse.status})`);
        }

                
        const donnees = await reponse.json();
        const country = donnees.nearest_area?.[0]?.country?.[0]?.value || "Indisponible";
        const area = donnees.nearest_area?.[0]?.region?.[0]?.value || "Indisponible";
        const town = donnees.nearest_area?.[0]?.areaName?.[0]?.value || "Indisponible";
        const temp = donnees.current_condition?.[0]?.temp_C || "Indisponible";
        const cold = donnees.current_condition?.[0]?.humidity || "Indisponible";
        const wind = donnees.current_condition?.[0]?.windspeedKmph || "Indisponible";
        const description = donnees.current_condition?.[0]?.lang_fr?.[0]?.value || donnees.current_condition?.[0]?.weatherDesc?.[0]?.value || "Non disponible";
        const luck = donnees?.weather?.[0]?.hourly?.[0]?.chanceofrain || "0";


        carteMeteo.innerHTML = `
            <div class="d-flex flex-column gap-3 gap-sm-3">

                <!--Pays-->
                    <div class="d-flex overflow-hidden align-items-stretch rounded-3 ms-2 me-2 ms-sm-2 me-sm-2" >
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
                        
                    <!--Region-->
                    <div class="d-flex overflow-hidden align-items-stretch rounded-3 ms-1 me-1 ms-sm-2 me-sm-2" >
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

                    <!--Ville-->
                    <div class="d-flex overflow-hidden align-items-stretch rounded-3 ms-1 me-1 ms-sm-2 me-sm-2" >
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

                    <!--Température-->
                    <div class="d-flex overflow-hidden align-items-stretch rounded-3 ms-1 me-1 ms-sm-2 me-sm-2" >
                        <div class="row w-50 g-0 bg-info align-items-center p-2 p-sm-3" >
                            <div class="col-3 text-center">
                                <i class="bi bi-thermometer-half text-light fs-5"></i>
                            </div>
                            <div class="col-9 p-0">
                                <p class="subtitle text-light m-0">Température:</p>
                            </div>
                        </div>
                        <div class="w-50 bg-light d-flex align-items-center justify-content-center p-2 p-sm-3">
                            <p class="text-info text-center fw-semibold m-0">${temp}${temp !=="Indisponible" ? "°C" : ""}</p>
                        </div>
                    </div>

                    <!--Humidité-->
                    <div class="d-flex overflow-hidden align-items-stretch rounded-3 ms-1 me-1 ms-sm-2 me-sm-2" >
                        <div class="row w-50 g-0 bg-info align-items-center p-2 p-sm-3">
                            <div class="col-3 text-center">
                                <i class="bi bi-droplet text-light fs-5"></i>
                            </div>
                            <div class="col-9 p-0">
                                
                                <p class="subtitle text-light m-0">Humidité:</p>
                            
                            </div>
                        </div>
                        <div class="w-50 bg-light d-flex align-items-center justify-content-center p-2 p-sm-3">
                            <p class="text-info text-center fw-semibold m-0">${cold}${cold !=="Indisponible" ? "%" : ""}</p>
                        </div>
                    </div>

                    <!--Vent-->
                    <div class="d-flex overflow-hidden align-items-stretch rounded-3 ms-1 me-1 ms-sm-2 me-sm-2" >
                        <div class="row w-50 g-0 bg-info align-items-center p-2 p-sm-3">
                            <div class="col-3 text-center">
                                <i class="bi bi-wind text-light fs-5"></i>
                            </div>
                            <div class="col-9 p-0">
                                <p class="subtitle text-light m-0">Vent:</p>
                            </div>
                        </div>
                        <div class="w-50 bg-light d-flex align-items-center justify-content-center p-2 p-sm-3">
                            <p class="text-info text-center fw-semibold m-0">${wind}${wind !=="Indisponible" ? "km/h" : ""}</p>
                        </div>
                        
                    </div>

                    <div class="rounded-3 w-100 h-auto align-items-center justify-content-center" id="describe">
                        <p class="p-3 mb-0 fw-bold" id="describing">Cette ville est sous la condition suivante: <strong>${description}</strong> avec <strong>${luck}%</strong> de risque de pluie.</p>
                    </div> 
            
                </div>
            `
            carteMeteo.classList.remove("d-none");

            // Mise à jour du message et déclenchement du Toast
            const toastMessage = document.getElementById("toast-message");
            const date = donnees.weather?.[0]?.date;
            const hour = donnees.current_condition?.[0]?.observation_time;
            if (date && hour) {
                toastMessage.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Données du ${date} à ${hour} UTC`;

            } else {
                toastMessage.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Données météo récupérées avec succès`;
            }

            const toastElement = document.getElementById("toast-meteo");
            const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
            toast.show();

        } catch (error) {
            carteMeteo.innerHTML = `
                <div class="alert alert-danger d-flex align-items-center" role="alert">
                    <i class="bi bi-exclamation-triangle-fill fs-4 me-2"></i>
                    <div>Erreur. Veuillez vérifier le nom de la ville et réessayer.</div>
                </div>
            `
            carteMeteo.classList.remove("d-none");

        }

            
            
    }

    formulaire.addEventListener("submit", (e) => {
        e.preventDefault();

        if (input.value.trim() !== "") {
            obtenirmeteo(input.value.trim());
        }
    })