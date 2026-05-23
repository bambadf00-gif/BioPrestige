// Google Apps Script (code.gs) – enregistrement des commandes
// Colonnes : Date | Heure | Nom | Téléphone | Adresse | Bundle | Quantité

function doPost(e) {
  const jsonResponse = { success: true, message: 'Commande enregistrée' };

  try {
    // 1️⃣ Lecture du corps JSON envoyé depuis le site
    const data = JSON.parse(e.postData.contents);

    // 2️⃣ Vérification des champs obligatoires
    const required = ['date', 'heure', 'nom', 'telephone', 'adresse', 'bundle', 'quantite'];
    for (const f of required) {
      if (!data[f]) throw new Error('Champ manquant : ' + f);
    }

    // 3️⃣ ✅ getActiveSpreadsheet() — fonctionne car le .gs est lié à la Sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Commandes') || ss.getSheets()[0];

    // 4️⃣ Ajout de la ligne dans la feuille
    sheet.appendRow([
      data.date,
      data.heure,
      data.nom,
      data.telephone,
      data.adresse,
      data.bundle,
      data.quantite,
    ]);

  } catch (error) {
    jsonResponse.success = false;
    jsonResponse.message = error.message;
  }

  // 5️⃣ Réponse JSON
  return ContentService
    .createTextOutput(JSON.stringify(jsonResponse))
    .setMimeType(ContentService.MimeType.JSON);
}