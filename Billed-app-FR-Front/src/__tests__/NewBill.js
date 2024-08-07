/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH } from "../constants/routes";
import router from "../app/Router";

global.alert = jest.fn();
global.console.error = jest.fn(); // Mock console.error for capturing errors

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "employee@test.tld"
      }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
    });

    test("Then NewBill is instantiated correctly", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: localStorageMock });

      expect(newBill).toBeTruthy();
      // Add more assertions as needed to test event listeners, initial state, etc.
    });

    test("Then I can upload a valid file", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: localStorageMock });

      const fileInput = screen.getByTestId("file");
      const file = new File(["image"], "image.png", { type: "image/png" });

      jest.spyOn(mockStore.bills(), "create").mockResolvedValueOnce({ fileUrl: "https://example.com/image.png", key: "1234" });

      fireEvent.change(fileInput, {
        target: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(newBill.fileUrl).toBe("https://example.com/image.png");
        expect(newBill.fileName).toBe("image.png");
        expect(newBill.billId).toBe("1234");
      });
    });

    test("Then the form should not submit if required fields are empty", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: localStorageMock });

      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(onNavigate).not.toHaveBeenCalledWith(ROUTES_PATH['Bills']);
      });
    });

    test("Then I can update a bill when store is available", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: localStorageMock });

      const bill = {
        email: "employee@test.tld",
        id: "1234",
        type: "Transports",
        name: "TGV Paris Lyon",
        amount: 100,
        date: "2023-12-31",
        vat: "20",
        pct: 10,
        commentary: "Rendez vous administratif",
        fileUrl: "https://example.com/image.png",
        fileName: "image.png",
        status: "pending"
      };

      jest.spyOn(mockStore.bills(), "update").mockResolvedValueOnce();

      newBill.updateBill(bill);

      await waitFor(() => {
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
      });
    });

    test("Then I can submit the form with valid data and handle submission error", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: localStorageMock });

      const form = screen.getByTestId("form-new-bill");

      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } });
      fireEvent.change(screen.getByTestId("expense-name"), { target: { value: "TGV Paris Lyon" } });
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-12-31" } });
      fireEvent.change(screen.getByTestId("amount"), { target: { value: "100" } });
      fireEvent.change(screen.getByTestId("vat"), { target: { value: "20" } });
      fireEvent.change(screen.getByTestId("pct"), { target: { value: "10" } });
      fireEvent.change(screen.getByTestId("commentary"), { target: { value: "Rendez vous administratif" } });

      jest.spyOn(mockStore.bills(), "update").mockRejectedValueOnce(new Error("API Error: Form submission failed"));

      fireEvent.submit(form);

      await waitFor(() => {
        expect(onNavigate).not.toHaveBeenCalledWith(ROUTES_PATH['Bills']);
        expect(console.error).toHaveBeenCalledWith(new Error("API Error: Form submission failed"));
        expect(alert).toHaveBeenCalledWith('Une erreur est survenue lors de la soumission du formulaire.');
      });
    });

    test("Then I see an error when the API call to upload the file fails", async () => {
      jest.spyOn(mockStore.bills(), "create").mockRejectedValueOnce(new Error("API Error: File upload failed"));

      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: localStorageMock });
      const fileInput = screen.getByTestId("file");

      fireEvent.change(fileInput, {
        target: {
          files: [new File(["document"], "document.pdf", { type: "application/pdf" })],
        },
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(new Error("API Error: Form submission failed"));
        expect(alert).toHaveBeenCalledWith('Seuls les fichiers jpg, jpeg et png sont autorisés.');
      });
    });

    test("Then I can fill out the form", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const expenseTypeSelect = screen.getByTestId("expense-type");
      const expenseNameInput = screen.getByTestId("expense-name");
      const datePickerInput = screen.getByTestId("datepicker");
      const amountInput = screen.getByTestId("amount");
      const vatInput = screen.getByTestId("vat");
      const pctInput = screen.getByTestId("pct");
      const commentaryInput = screen.getByTestId("commentary");

      fireEvent.change(expenseTypeSelect, { target: { value: "Transports" } });
      fireEvent.change(expenseNameInput, { target: { value: "TGV Paris Lyon" } });
      fireEvent.change(datePickerInput, { target: { value: "2023-12-31" } });
      fireEvent.change(amountInput, { target: { value: "100" } });
      fireEvent.change(vatInput, { target: { value: "20" } });
      fireEvent.change(pctInput, { target: { value: "10" } });
      fireEvent.change(commentaryInput, { target: { value: "Rendez vous administratif" } });

      expect(expenseTypeSelect.value).toBe("Transports");
      expect(expenseNameInput.value).toBe("TGV Paris Lyon");
      expect(amountInput.value).toBe("100");
      expect(datePickerInput.value).toBe("2023-12-31");
      expect(vatInput.value).toBe("20");
      expect(pctInput.value).toBe("10");
      expect(commentaryInput.value).toBe("Rendez vous administratif");
    });

    test("Then I see the error message: Seuls les fichiers jpg, jpeg et png sont autorisés. (invalid PDF file)", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: localStorageMock });

      const handleChangeFile = jest.spyOn(newBill, 'handleChangeFile');
      const fileInput = screen.getByTestId("file");

      fileInput.addEventListener('change', newBill.handleChangeFile);

      fireEvent.change(fileInput, {
        target: {
          files: [new File(["document"], "document.pdf", { type: "application/pdf" })],
        },
      });

      await waitFor(() => {
        expect(handleChangeFile).toHaveBeenCalled();
        expect(alert).toHaveBeenCalledWith('Seuls les fichiers jpg, jpeg et png sont autorisés.');
        expect(fileInput.value).toBe(''); // The input file should be reset
      });
    });
  });
});