import { ROUTES_PATH } from '../constants/routes.js';
import { formatDate, formatStatus } from "../app/format.js";
import Logout from "./Logout.js";

export default class {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;

    // Déclaration de buttonNewBill
    const buttonNewBill = document.querySelector('button[data-testid="btn-new-bill"]');
    if (buttonNewBill) buttonNewBill.addEventListener('click', this.handleClickNewBill);

    // Ajout des événements pour les icônes
    const iconEye = document.querySelectorAll('div[data-testid="icon-eye"]');
    if (iconEye) iconEye.forEach(icon => {
      icon.addEventListener('click', () => this.handleClickIconEye(icon));
    });

    // Initialisation de Logout
    new Logout({ document, localStorage, onNavigate });
  }

  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH['NewBill']);
  }

  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute("data-bill-url");
    const imgWidth = Math.floor($('#modaleFile').width() * 0.5);
    $('#modaleFile').find(".modal-body").html(`<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`);
    $('#modaleFile').modal('show');
  }

  getBills = () => {
    if (this.store) {
      return this.store.bills().list().then(snapshot => {

        // Trier le tableau par date en ordre croissant
        const bills = snapshot
          .sort((a, b) => Date.parse(a.date) - Date.parse(b.date)) // Tri par date croissante
          .map(doc => {
            try {
              return {
                ...doc,
                date: formatDate(doc.date), // Formater la date
                status: formatStatus(doc.status) // Formater le statut
              };
            } catch (e) {
              // En cas d'erreur dans le formatage, retourner les données non formatées
              console.log(e, 'for', doc);
              return {
                ...doc,
                date: doc.date, // Conserver la date originale en cas d'erreur
                status: formatStatus(doc.status) // Formater le statut
              };
            }
          });

        // Afficher la longueur des factures et les détails pour le débogage
        console.log('length', bills.length);
        bills.forEach(bill => {
          console.log(`Date: ${bill.date}, Statut: ${bill.status}`);
        });

        return bills;
      });
    }
  }
}