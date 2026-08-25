Cypress.Commands.add("visitAsUser", (path = "/") => {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem("token", JSON.stringify({ user_id: "user-1" }));
      win.localStorage.setItem(
        "user",
        JSON.stringify({ id: "user-1", email: "test@mystyla.local", username: "Test User" }),
      );
    },
  });
});
