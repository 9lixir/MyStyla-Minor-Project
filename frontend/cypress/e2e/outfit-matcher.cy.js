const garments = [
  {
    id: "g1",
    filename: "office shirt.png",
    cutout_path: "",
    dominant_colors: [{ hex: "#FFFFFF" }],
    user_id: "user-1",
    category: "top",
    tags: {
      category: "top",
      formality: "Formal",
      season: "All-Season",
      pattern: "Solid",
      occasion: ["Office"],
    },
  },
];

describe("Outfit matcher", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/scanning/garments", {
      message: "Found 1 garments",
      garments,
    });
    cy.intercept("GET", "**/outfits/health", {
      status: "outfit_matching engine is running",
    });
  });

  it("generates outfits when weather API is unavailable", () => {
    cy.intercept("GET", "**/weather/current*", {
      statusCode: 502,
      body: { detail: "Weather provider is unavailable" },
    }).as("weatherFailure");
    cy.intercept("POST", "**/outfits/generate", (req) => {
      expect(req.body.weather).to.equal(null);
      req.reply({
        message: "Generated 1 outfit(s) for occasion 'Office'",
        occasion: "Office",
        weather: null,
        wardrobe_size_after_filter: 2,
        outfits: [
          {
            garments,
            harmony_score: 1,
            compat_score: 0.9,
            weather_score: 0.6,
            final_score: 0.84,
            formality: "Formal",
            accessories: [],
          },
        ],
      });
    }).as("generateOutfits");

    cy.visitAsUser();
    cy.contains("button", "Match").click();
    cy.wait("@weatherFailure");
    cy.contains("Weather skipped").should("be.visible");
    cy.contains("button", "Generate Outfits").click();
    cy.wait("@generateOutfits");
    cy.contains("Generated 1 outfit").should("be.visible");
  });

  it("builds compatible matches around a selected garment", () => {
    cy.intercept("GET", "**/weather/current*", {
      temperature_c: 22,
      feels_like_c: 22,
      wind_kph: 8,
      condition: "clear",
      style_profile: "mild",
    });
    cy.intercept("POST", "**/outfits/build-around", (req) => {
      expect(req.body.user_id).to.equal("user-1");
      expect(req.body.garment_id).to.equal("g1");
      expect(req.body.occasion).to.equal("Office");
      req.reply({
        message: "Found 1 compatible match(es).",
        anchor_garment: garments[0],
        matches: [
          {
            id: "g2",
            filename: "black trousers.png",
            cutout_path: "",
            category: "bottom",
            compatibility_score: 0.92,
          },
        ],
      });
    }).as("buildAround");

    cy.visitAsUser();
    cy.contains("button", "Match").click();
    cy.contains("button", "Match This Item").click();
    cy.wait("@buildAround");
    cy.contains("black trousers.png").should("be.visible");
    cy.contains("92%").should("be.visible");
  });
});
