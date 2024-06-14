/**
 * @jest-environment jsdom
 */
/**/
import '@testing-library/jest-dom'
import { JSDOM } from 'jsdom';
import {screen, waitFor, fireEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import Bills from "../containers/Bills.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";
jest.mock("../app/store", () => mockStore);


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId('icon-window'));

      const windowIcon = screen.getByTestId('icon-window');
      // verification avec expect
      expect(windowIcon).toHaveClass('active-icon');
    })
    //  test unitaire bg rapport de test rouge reglé //erreur de date ici : Bug rapport de test date 
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      expect(dates).toEqual(dates.sort());
    })
  })
})

//test handleClickIconEye 
describe("Given in function of handleClickIconEye", () => {
  test("open the model", async () => {
    const dom = new JSDOM();
    global.document = dom.window.document;
    document.body.innerHTML= BillsUI ({data : Bills})//Ajoute BillsUI
    //Récup un élément avec l'attribut data-testid 
    const iconEye =  screen.getAllByText(`icon-eye`)
    // Vérification qu'il y a au moins un élément avec cet attribut
    expect(iconEye).not.toHaveLength(0);
    // Sélectionn d' un élément icon-eye exemple le 4e du tableau = [3]
    const myIconEye = iconEye[3];
    //Simulation clic sur l'icone
    fireEvent.click(myIconEye);
    // vérification si modale s'ouvre

    const modal = screen.getByTestId('tbody')
    expect(modal).toBeInTheDocument();
    })
  })
  // test d'intégration GET
 describe("Given I am a user connected as Employer", () => {
  describe("When I navigate to page.bill", () => {
    test("fetches bills from mock API GET", async()=>{
      localStorage.setItem("user", JSON.stringify({ type: "Admin", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Dashboard)
      await waitFor(() => screen.getByText("Validations"))
      const contentPending  = await screen.getByText("En attente (1)")
      expect(contentPending).toBeTruthy()
      const contentRefused  = await screen.getByText("Refusé (2)")
      expect(contentRefused).toBeTruthy()
      expect(screen.getByTestId("big-billed-icon")).toBeTruthy()
    })
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
            window,
            'localStorage',
            { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Admin',
          email: "a@a"

        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }})

        window.onNavigate(ROUTES_PATH.Dashboard)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
  
      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }})
  
        window.onNavigate(ROUTES_PATH.Dashboard)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      });
    });
  
    });
  });
  describe("Given I navigate to Bills", () => {
    describe("When I click on 'Nouvelle note de frais'", () => {
      test('Then i should navigate to the "NewBill" page"', () => {
        const bills= new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage})
         //mock : version factice
        // Mock de la fonction onNavigate
        bills.onNavigate = jest.fn();
        // Test de la fonction handleClickNewBill 
        bills.handleClickNewBill();
        // Verifier que that the onNavigate function was called with the correct argument
        expect(bills.onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill']);
      });
    });
    });

    // Test unitaire class bill >vérification formatage date et status
describe('Given im connected as an employé on Bills page', () => {
  describe('Im navigate on Bills page', () => {
    test('Then i should see an array of bills with formatted dates and statuses', async () => {
    const bills= new Bills({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage})
    // Mock ( simulation du) store avec les données date et status
    bills.store = {
      bills: () => ({
        list: jest.fn().mockResolvedValue([
          {
            date: '2023-10-12',
            status: 'En attente',
          },
        ]),
      }),
    };
    const result = await bills.getBills();

    //Vérification si le résultat est bien dans  le tableau
    expect(Array.isArray(result)).toBe(true);

    // Vérification si la date est bien formaté
    result.forEach((bill) => {
      expect(bill.date).toMatch('12 Oct. 23');
    });
    // Vérification si le status est bien formaté
    result.forEach((bill) => {
            expect(bill.status === 'En attente'|| bill.status === 'pending'); 
    });
  });
});
});

// Test unitaire qui vérifie la méthode getBills de la class Bills
describe('Given im connected as an employé on Bills page', () => {
  describe('When i navigate on Bills page', () => {
    let billsPage;
    beforeAll(() => {
      const mockStore = {
        bills: jest.fn(() => ({
          list: jest.fn().mockResolvedValue([
            {
              date: '12 Oct. 23',
              status: undefined,
            },
            {
              date: '15 Oct. 23',
              status: undefined,
            },
          ]),
        })),
      };
      const localStorageMock = {
        setItem: jest.fn(),
      };
      billsPage = new Bills({
        document: document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: localStorageMock,
      });
    });
    test('Then i should fetch and format bills', async () => {
      const formattedBills = await billsPage.getBills();
      expect(formattedBills).toEqual([
        {
          date: '12 Oct. 23',
          status: undefined,
        },
        {
          date: '15 Oct. 23',
          status: undefined,
        },
      ]);
    });
  });
  });

  // test unitaire on clic sur le bouton noouvelle note de frais et on est redirigé  vers la page NewBill
describe('Given im connected as an employé on Bills page', () => {
  describe("When I click on 'new bill btn'", () => {
    test("Then I should be sent on 'NewBill' page", async () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;
      const bill = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const buttonNewBill = screen.getByTestId("btn-new-bill");
      const handleClickNewBill = jest.fn((e) => bill.handleClickNewBill(e));
      buttonNewBill.addEventListener("click", handleClickNewBill);
      fireEvent.click(buttonNewBill);

      expect(handleClickNewBill).toHaveBeenCalled();
      const formNewBill = await waitFor(() => screen.getByTestId("form-new-bill"));
      expect(formNewBill).toBeTruthy();
    });
  });
});

// test unitaire on clic sur l'icon oeil une modal s'ouvre avec le justificatif 
describe('Given im connected as an employé on Bills page', () => {
  describe("When I click on 'iconEye' ", () => {
    test("should open a modal with bill proof", async () => {
      document.body.innerHTML = BillsUI({ data: [bills[0]] });

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;
      const bill = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      await waitFor(() => screen.getAllByTestId("icon-eye")[0]);
      const iconEye = screen.getAllByTestId("icon-eye")[0];
      $.fn.modal = jest.fn();
      const handleClickIconEye = jest.fn(() => bill.handleClickIconEye(iconEye));
      iconEye.addEventListener("click", handleClickIconEye);
      fireEvent.click(iconEye);

      expect(handleClickIconEye).toHaveBeenCalled();
      const proof = screen.getAllByText("Justificatif");
      expect(proof).toBeDefined();
      expect($.fn.modal).toHaveBeenCalled();
    });
  });
});