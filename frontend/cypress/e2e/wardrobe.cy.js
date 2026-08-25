const garments = [
  {
    id: "g1",
    filename: "blue kurti.png",
    cutout_path: "",
    dominant_colors: [{ hex: "#3B82F6" }],
    user_id: "user-1",
    tags: {
      category: "top",
      formality: "Casual",
      season: "Summer",
      pattern: "Solid",
      occasion: ["Casual"],
    },
  },
];

describe("Wardrobe management", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/scanning/garments", {
      message: "Found 1 garments",
      garments,
    }).as("getGarments");
  });

  it("edits a garment name and tags", () => {
    cy.intercept("PUT", "**/scanning/garments/g1/details", (req) => {
      expect(req.body.filename).to.equal("winter kurti");
      expect(req.body.category).to.equal("bottom");
      expect(req.body.season).to.equal("winter");
      req.reply({
        message: "Garment details updated",
        garment: {
          ...garments[0],
          filename: "winter kurti",
          category: "bottom",
          tags: {
            category: "bottom",
            formality: "Casual",
            season: "Winter",
            pattern: "Solid",
            occasion: ["Wedding"],
          },
        },
      });
    }).as("updateGarment");

    cy.visitAsUser();
    cy.wait("@getGarments");

    cy.contains("blue kurti.png").click();
    cy.get("[data-cy=garment-details-modal]").should("be.visible");
    cy.get("[data-cy=garment-name-input]").clear().type("winter kurti");
    cy.get("[data-cy=garment-category-select]").select("bottom");
    cy.get("#garment-season").select("winter");
    cy.contains("button", "wedding").click();
    cy.get("[data-cy=save-garment-details]").click();

    cy.wait("@updateGarment");
    cy.get("[data-cy=save-garment-success]").should("contain", "Saved changes");
    cy.contains("winter kurti").should("be.visible");
    cy.get("[data-cy=garment-category-select]").should("have.value", "bottom");
  });

  it("deletes a garment after confirmation", () => {
    cy.intercept("DELETE", "**/scanning/garments/g1", {
      message: "Garment deleted",
      garment_id: "g1",
    }).as("deleteGarment");

    cy.visitAsUser();
    cy.wait("@getGarments");

    cy.get("[data-cy=garment-card]").should("have.length", 1);
    cy.get("[data-cy=delete-garment-button]").click({ force: true });
    cy.contains("[data-cy=delete-garment-button]", "Confirm?").click({ force: true });

    cy.wait("@deleteGarment").its("response.statusCode").should("eq", 200);
    cy.get("[data-cy=garment-card]").should("not.exist");
  });
});
