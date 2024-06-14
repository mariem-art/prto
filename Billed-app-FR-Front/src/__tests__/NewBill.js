/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import {render, screen, fireEvent, waitFor, getByTestId } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import {localStorageMock} from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import {expect, jest, test} from '@jest/globals';

import jsdom from 'jsdom'; //  importation la bibliothèque jsdom, pour simuler un environnement DOM
import userEvent from '@testing-library/user-event'
const { JSDOM } = jsdom; //  importation l'objet JSDOM de jsdom, pour créer une instance d'un environnement DOM simulé.





// Simuler le localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => JSON.stringify({ email: 'test@test.com' })),
    setItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true
});

const storeMock = {
  bills: () => ({
    create: jest.fn(() => Promise.reject(new Error('Erreur 500'))), // Simuler une erreur lors de la création
    update: jest.fn(() => Promise.resolve())
  })
};


// test : remplire le formulaire
describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then  i can fill out the form", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      
      // récupérer les éléments et les remplir( fill out the form)
      // Type de dépense 
      const expenseTypeSelect  = screen.getByTestId("expense-type");
      // Nom de la dépense 
      const expenseNameInput = screen.getByTestId("expense-name");
      // Date
      const datePickerInput = screen.getByTestId("datepicker");
      //montant TTC
      const amountInput = screen.getByTestId("amount");
      //TVA
      const vatInput = screen.getByTestId("vat");
      const pctInput = screen.getByTestId("pct");
      //commentaire
      const commentaryInput = screen.getByTestId("commentary");
     // Mock console.error pour vérifier son appel
     jest.spyOn(console, 'error').mockImplementation(() => {});

      //Simuler l'input d'un employé
      fireEvent.change(expenseTypeSelect, { target: { value: "Transports"} });
      fireEvent.change(expenseNameInput, { target: { value: "TGV Paris Lyon" } });
      fireEvent.change(amountInput, { target: { value: "100" } });
      fireEvent.change(datePickerInput, { target: { value: "2023-12-31" } });
      fireEvent.change(vatInput, { target: { value: "20" } });
      fireEvent.change(pctInput, { target: { value: "10" } });
      fireEvent.change(commentaryInput, { target: { value: "Rendez vous administratif" } });

      // vérifier que les champs du formulaire ont été remplis
      expect(expenseTypeSelect.value).toBe("Transports");
      expect(expenseNameInput.value).toBe("TGV Paris Lyon");
      expect(amountInput.value).toBe("100");
      expect(datePickerInput.value).toBe("2023-12-31");
      expect(vatInput.value).toBe("20");
      expect(pctInput.value).toBe("10");
      expect(commentaryInput.value).toBe("Rendez vous administratif");

    })
  })
})

// test : ajouter un fichier PDF lance une alerte  ( fonction handleChangeFile)
describe("Given I am on NewBill Page", () => {
  describe("When add a new non-allowed PDF file", () => {
    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    // Récupérer l'extension du fichier
    const fileInput = screen.getByTestId("file");
    const file = fileInput.files[0];
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();

   if (allowedExtensions.includes(fileExtension)) {
     const formData = new FormData();
     const email = JSON.parse(localStorage.getItem("user")).email;
     formData.append('file', file);
     formData.append('email', email);

     this.store
     .bills()
     .create({
       data: formData,
       headers: {
         noContentType: true
        }
      })
     .then(({ fileUrl, key }) => {
       console.log(fileUrl);
       this.billId = key;
       this.fileUrl = fileUrl;
       this.fileName = fileName;
      })
      .catch(error => console.error(error));
      test("Then I see the error message: Seuls les fichiers jpg, jpeg et png sont autorisés.", () => {
      // Création une instance de NewBill en lui passant des propriétés factices
      const donneesFactices = {
        document,
        onNavigate: jest.fn(),
        store: {},
        localStorage: {},
      };
      const newBill = new NewBill(donneesFactices);
      // Simulation la sélection d'un fichier PDF non autorisé
      
      fireEvent.change(fileInput, {
        target: {
          files: [new File(["file contents"], "file.pdf", { type: "application/pdf" })]
        }
      });

      // Interception l'appel à window.alert avec spyOn
      const alert = jest.spyOn(window, 'alert').mockImplementation(() => {});

      // Exécution la fonction handleChangeFile qui déclenche l'alerte
      newBill.handleChangeFile({
        preventDefault: () => {}, // Ajoutez cette ligne pour éviter l'erreur
        target: { value: 'file.pdf' }
      });

      // Vérification que l'alerte a été appelée avec le bon message
      expect(alert).toHaveBeenCalledWith('Seuls les fichiers jpg, jpeg et png sont autorisés.');
      
      // Restauration la fonction alert d'origine
      alert.mockRestore();
    }
   });
});


//test d'integration POST
describe("Given I am a user connected as Employee", () => {
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
    })
   //test erreur 404
   test("submit form  and fails with 404 message error", async () => {
     mockStore.bills.mockImplementationOnce(() => {
       return {
          update : () =>  {
           return Promise.reject(new Error("Erreur 404"))
          }
        }
      })
      document.body.innerHTML = NewBillUI()
      const billNew = new NewBill({
       document,
       onNavigate,
       store: mockStore,
       localStorage: window.localStorage
      })
     // récupération des éléments
     const myDate = screen.getByTestId("datepicker")
     const myAmont = screen.getByTestId("amount")
     const myTva = screen.getByTestId("pct")
     const myFile = screen.getByTestId("file")
     const mySubmitButton = document.getElementById("btn-send-bill")
     //  d'un nouveau fichier
     const myMewFile = new File(['image.jpg'], 'mon-image.jpg' , { type: "image/jpeg"})
     const myUpdate = jest.spyOn(mockStore.bills(), 'update')
     //Simulation l'input saisie des infos avec des erreurs
     fireEvent.change(myDate,{target:{value:'Vanille'}})
     fireEvent.change(myAmont,{target:{value:'bonbon'}})
     fireEvent.change(myTva,{target:{value:'chocolade'}})
     myFile.addEventListener('change',billNew.handleChangeFile)
     userEvent.upload(myFile,myMewFile);
     await new Promise(process.nextTick)
     mySubmitButton.addEventListener('click', billNew.handleSubmit)
     try {
       await new Promise(process.nextTick);
       await myUpdate();
      } catch (error) {
    expect(error).toEqual(new Error("Erreur 404"));
    }
  })
   //test erreur 500
  test("submit form  and fails with 500 message error", async () => {
  mockStore.bills.mockImplementationOnce(() => {
    return {
      update : () =>  {
        return Promise.reject(new Error("Erreur 500"))
      }
    }
  })
  const mockOnNavigate = jest.fn();
  document.body.innerHTML = NewBillUI()
  const billNew = new NewBill({
    document: window.document,
    onNavigate: mockOnNavigate,
    store: mockStore,
    localStorage: window.localStorage
  })
  // récupération des éléments
  const myDate = screen.getByTestId("datepicker")
  const myAmont = screen.getByTestId("amount")
  const myTva = screen.getByTestId("pct")
  const myFile = screen.getByTestId("file")
  const mySubmitButton = document.getElementById("btn-send-bill")
  //  d'un nouveau fichier
  const myMewFile = new File(['image.jpg'], 'mon-image.jpg' , { type: "image/jpeg"})
  const myUpdate = jest.spyOn(mockStore.bills(), 'update')
  //Simulation de  l'input saisie des infos avec des erreurs
  fireEvent.change(myDate,{target:{value:'Vanille'}})
  fireEvent.change(myAmont,{target:{value:'bonbon'}})
  fireEvent.change(myTva,{target:{value:'chocolade'}})
  myFile.addEventListener('change',billNew.handleChangeFile)
  userEvent.upload(myFile,myMewFile);
  await new Promise(process.nextTick)
  mySubmitButton.addEventListener('click', billNew.handleSubmit)
  try {
   await new Promise(process.nextTick);
   await myUpdate();
  } catch (error) {
     expect(error).toEqual(new Error("Erreur 500"))
    }
  })
})
})
describe('NewBill', () => {
  it('should call updateBill with the correct bill object', async () => {
   const mockOnNavigate = jest.fn();
   document.body.innerHTML = NewBillUI();
   // Soumettre le formulaire
   fireEvent.submit(form);
   const billNew = new NewBill({
     document: window.document,
     onNavigate: mockOnNavigate,
     store: mockStore,
     localStorage: window.localStorage
    })

    // Récupération des éléments
    const myDate = screen.getByTestId('datepicker');
    const myAmount = screen.getByTestId('amount');
    const myPct = screen.getByTestId('pct');
    const myVat = screen.getByTestId('vat');
    const myFile = screen.getByTestId('file');
    const myExpenseType = screen.getByTestId('expense-type');
    const myExpenseName = screen.getByTestId('expense-name');
    const myCommentary = screen.getByTestId('commentary');

    // Simulation de la saisie des informations
    fireEvent.change(myDate, { target: { value: '2023-10-10' } });
    fireEvent.change(myAmount, { target: { value: '300' } });
    fireEvent.change(myPct, { target: { value: '80' } });
    fireEvent.change(myVat, { target: { value: '20' } });

    // Simulation du téléchargement d'un fichier
    const file = new File(['image.jpg'], 'mon-image.jpg', { type: 'image/jpeg' });
    userEvent.upload(myFile, file);

    // Simulation de la sélection d'un type de dépense
    fireEvent.change(myExpenseType, { target: { value: 'Transport' } });

    // Simulation de la saisie du nom de la dépense et du commentaire
    fireEvent.change(myExpenseName, { target: { value: 'Nom de la dépense' } });
    fireEvent.change(myCommentary, { target: { value: 'Commentaire' } });

    //  mise en place d'un  espion (spy) pour la méthode updateBill
    const updateBillSpy = jest.spyOn(billNew, 'updateBill');

    // mise en place d'un événement fictif pour simuler le formulaire
    const fakeEvent = {
      preventDefault: jest.fn(),
      target: {
        querySelector: jest.fn((selector) => {
          if (selector === 'input[data-testid="datepicker"]') {
            return myDate;
          }
          if (selector === 'select[data-testid="expense-type"]') {
            return myExpenseType;
          }
          if (selector === 'input[data-testid="amount"]') {
            return myAmount;
          }
          if (selector === 'input[data-testid="pct"]') {
            return myPct;
          }
          if (selector === 'input[data-testid="vat"]') {
            return myVat;
          }
          if (selector === 'input[data-testid="expense-name"]') {
            return myExpenseName;
          }
          if (selector === 'textarea[data-testid="commentary"]') {
            return myCommentary;
          }
          if (selector === 'input[data-testid="file"]') {
            return myFile;
          }
        }),
      },
    };

    billNew.handleSubmit(fakeEvent);
    const expectedBill = {
      email: undefined,
      type: '',
      date: '2023-10-10', 
      status: 'pending',
      name: 'Nom de la dépense',
      amount: 300,
      pct: 80,
      vat: '20',
      commentary: 'Commentaire',
      fileUrl: null,
      fileName : null
    };

    expect(updateBillSpy).toHaveBeenCalledWith(expectedBill);

    // Restaurez le spy après le test
    updateBillSpy.mockRestore();
  });
});


// Test unitaire vérification de l'icon email s'ile st en surbrillance ( class active)
describe("Given I am connected as an employee", () => {
  describe("When I am on the New Bills Page", () => {
    test("Then the email icon in the vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => document.getElementById('layout-icon2'))
      const emailIconLight = document.getElementById("layout-icon2");
      
      if (emailIconLight) {
        userEvent.click(emailIconLight);
        expect(emailIconLight.className).toBe("active-icon");
      } else {
        console.log('Aucun email icon trouvé ');
      }
    })
  })
})


// test unitaire on clic sur le bouton envoyeron est redirigé  vers la page Bill
describe('Given im connected as an employé on NewBill page', () => {
  describe("When I click on 'Envoyer'", () => {
    test("Then I should be sent on 'Bill' page", async () => {
      document.body.innerHTML = NewBillUI({ data: NewBill });

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;
      const billnew = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });


  // Récupération des éléments
  const myDate = screen.getByTestId('datepicker');
  const myAmount = screen.getByTestId('amount');
  const myPct = screen.getByTestId('pct');
  const myVat = screen.getByTestId('vat');
  const myFile = screen.getByTestId('file');
  const myExpenseType = screen.getByTestId('expense-type');
  const myExpenseName = screen.getByTestId('expense-name');
  const myCommentary = screen.getByTestId('commentary');

  // Simulation de la saisie des informations
  fireEvent.change(myDate, { target: { value: '2023-10-10' } });
  fireEvent.change(myAmount, { target: { value: '300' } });
  fireEvent.change(myPct, { target: { value: '80' } });
  fireEvent.change(myVat, { target: { value: '20' } });

  // Simulation du téléchargement d'un fichier
  const file = new File(['image.jpg'], 'mon-image.jpg', { type: 'image/jpeg' });
  userEvent.upload(myFile, file);

  // Simulation de la sélection d'un type de dépense
  fireEvent.change(myExpenseType, { target: { value: 'Transport' } });

  // Simulation de la saisie du nom de la dépense et du commentaire
  fireEvent.change(myExpenseName, { target: { value: 'Nom de la dépense' } });
  fireEvent.change(myCommentary, { target: { value: 'Commentaire' } });


   //  mise en place d'un  espion (spy) pour la méthode updateBill
   const updateBillSpy = jest.spyOn(billnew, 'updateBill');

 // mise en place d'un événement fictif pour simuler le formulaire
 const fakeEvent = {
  preventDefault: jest.fn(),
  target: {
    querySelector: jest.fn((selector) => {
      if (selector === 'input[data-testid="datepicker"]') {
        return myDate;
      }
      if (selector === 'select[data-testid="expense-type"]') {
        return myExpenseType;
      }
      if (selector === 'input[data-testid="amount"]') {
        return myAmount;
      }
      if (selector === 'input[data-testid="pct"]') {
        return myPct;
      }
      if (selector === 'input[data-testid="vat"]') {
        return myVat;
      }
      if (selector === 'input[data-testid="expense-name"]') {
        return myExpenseName;
      }
      if (selector === 'textarea[data-testid="commentary"]') {
        return myCommentary;
      }
      if (selector === 'input[data-testid="file"]') {
        return myFile;
      }
    }),
  },
};

billnew.handleSubmit(fakeEvent);

 const expectedBill = {
   email: undefined,
   type: '',
   date: '2023-10-10', 
   status: 'pending',
   name: 'Nom de la dépense',
   amount: 300,
   pct: 80,
   vat: '20',
   commentary: 'Commentaire',
   fileUrl: null,
   fileName : null
  };

      expect(updateBillSpy).toHaveBeenCalledWith(expectedBill);
      // expect(handleSubmit).toHaveBeenCalled();
      expect(updateBillSpy).toHaveBeenCalled();
      const Bill = await waitFor(() => screen.getByText("Mes notes de frais"));
      expect(Bill).toBeTruthy();
    
    });
  });
});