describe("Scanning and classification", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/scanning/garments", {
      message: "No garments found",
      garments: [],
    });
  });

  it("uploads a garment, reviews classifier tags, and saves classification", () => {
    cy.intercept("POST", "**/scanning/upload", {
      message: "Image uploaded and processed successfully",
      garment_id: "scan-1",
      filename: "kurti.png",
      cutout: "processed/kurti.png",
      dominant_colors: [{ hex: "#3B82F6" }],
      tags: {
        category: "kurti",
        formality: "casual",
        season: "summer",
        pattern: "solid",
        occasion: ["everyday wear"],
      },
      suggested_classification: {
        category: "kurti",
        formality: "casual",
        season: "summer",
        pattern: "solid",
        occasion: ["everyday wear"],
      },
      flags: {
        category: true,
      },
    }).as("uploadGarment");

    cy.intercept("PUT", "**/scanning/garments/scan-1/classification", (req) => {
      expect(req.body.user_id).to.equal("user-1");
      expect(req.body.category).to.equal("kurti");
      expect(req.body.formality).to.equal("casual");
      expect(req.body.season).to.equal("summer");
      expect(req.body.pattern).to.equal("solid");
      expect(req.body.occasion).to.include("everyday wear");
      req.reply({
        message: "Garment classification saved",
        garment_id: "scan-1",
      });
    }).as("saveClassification");

    cy.visitAsUser();
    cy.contains("button", "Add Garment").click();
    cy.get("input[type=file]").first().selectFile(
      {
        contents: Cypress.Buffer.from("mock image"),
        fileName: "kurti.png",
        mimeType: "image/png",
      },
      { force: true },
    );
    cy.contains("button", "Upload & Scan").click();
    cy.wait("@uploadGarment");
    cy.contains("Review Tags").should("be.visible");
    cy.contains("Low confidence").should("be.visible");
    cy.contains("button", "Save to Wardrobe").click();
    cy.wait("@saveClassification");
  });

  it("records manual classifier tag corrections through the API", () => {
    cy.intercept("POST", "**/classification/garments/scan-1/correct-tag*", (req) => {
      expect(req.query.field).to.equal("category");
      expect(req.query.predicted).to.equal("shirt");
      expect(req.query.corrected).to.equal("kurti");
      req.reply({
        status: "success",
        id: "correction-1",
      });
    }).as("correctTag");

    cy.visitAsUser();
    cy.window().then((win) =>
      win.fetch(
        "http://localhost:8000/classification/garments/scan-1/correct-tag?field=category&predicted=shirt&corrected=kurti",
        { method: "POST" },
      ),
    );
    cy.wait("@correctTag");
  });
});
