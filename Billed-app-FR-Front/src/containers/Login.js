/**
 * @jest-environment jsdom
 */

import LoginUI from "../views/LoginUI";
import Login from "../containers/Login.js";
import { ROUTES } from "../constants/routes";
import { fireEvent, screen } from "@testing-library/dom";

describe("Given that I am a user on login page", () => {
  describe("When I do not fill fields and I click on employee button Login In", () => {
    test("Then It should renders Login page", () => {
      document.body.innerHTML = LoginUI();

      const inputEmailUser = screen.getByTestId("employee-email-input");
      expect(inputEmailUser.value).toBe("");

      const inputPasswordUser = screen.getByTestId("employee-password-input");
      expect(inputPasswordUser.value).toBe("");

      const form = screen.getByTestId("form-employee");
      const handleSubmit = jest.fn((e) => e.preventDefault());

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(screen.getByTestId("form-employee")).toBeTruthy();
    });
  });
 // we use a class so as to test its methods in e2e tests
 // export default class Login {
  // constructor({ document, localStorage, onNavigate, PREVIOUS_LOCATION, store }) {
  //   this.document = document
  //   this.localStorage = localStorage
  //   this.onNavigate = onNavigate
  //   this.PREVIOUS_LOCATION = PREVIOUS_LOCATION
  //   this.store = store
  //   const formEmployee = this.document.querySelector(`form[data-testid="form-employee"]`)
  //   formEmployee.addEventListener("submit", this.handleSubmitEmployee)
  //   const formAdmin = this.document.querySelector(`form[data-testid="form-admin"]`)
  //   formAdmin.addEventListener("submit", this.handleSubmitAdmin)
  // }
  handleSubmitEmployee = e => {
    e.preventDefault()
    const user = {
      type: "Employee",
      email: e.target.querySelector(`input[data-testid="employee-email-input"]`).value,
      password: e.target.querySelector(`input[data-testid="employee-password-input"]`).value,
      status: "connected"
    }
    this.localStorage.setItem("user", JSON.stringify(user))
    this.login(user)
      .catch(
        (err) => this.createUser(user)
      )
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
        this.PREVIOUS_LOCATION = ROUTES_PATH['Bills']
        PREVIOUS_LOCATION = this.PREVIOUS_LOCATION
        this.document.body.style.backgroundColor="#fff"
      })

  }

  handleSubmitAdmin = e => {
    e.preventDefault()
    const user = {
      type: "Admin",
      email: e.target.querySelector(`input[data-testid="admin-email-input"]`).value,
      password: e.target.querySelector(`input[data-testid="admin-password-input"]`).value,
      status: "connected"
    }
    this.localStorage.setItem("user", JSON.stringify(user))
    this.login(user)
      .catch(
        (err) => this.createUser(user)
      )
      .then(() => {
        this.onNavigate(ROUTES_PATH['Dashboard'])
        this.PREVIOUS_LOCATION = ROUTES_PATH['Dashboard']
        PREVIOUS_LOCATION = this.PREVIOUS_LOCATION
        document.body.style.backgroundColor="#fff"
      })
  }

  // not need to cover this function by tests
  login = (user) => {
    if (this.store) {
      return this.store
      .login(JSON.stringify({
        email: user.email,
        password: user.password,
      })).then(({jwt}) => {
        localStorage.setItem('jwt', jwt)
      })
    } else {
      return null
    }
  }

  // not need to cover this function by tests
  createUser = (user) => {
    if (this.store) {
      return this.store
      .users()
      .create({data:JSON.stringify({
        type: user.type,
        name: user.email.split('@')[0],
        email: user.email,
        password: user.password,
      })})
      .then(() => {
        console.log(`User with ${user.email} is created`)
        return this.login(user)
      })
    } else {
      return null
    }
  }
}