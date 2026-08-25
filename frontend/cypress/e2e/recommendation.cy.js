describe("Recommendations", () => {
  const outfit = {
    garments: [
      {
        id: "g1",
        filename: "office shirt.png",
        cutout_path: "",
        dominant_colors: [{ hex: "#FFFFFF" }],
        category: "top",
      },
      {
        id: "g2",
        filename: "black trousers.png",
        cutout_path: "",
        dominant_colors: [{ hex: "#111111" }],
        category: "bottom",
      },
    ],
    harmony_score: 0.95,
    compat_score: 0.9,
    weather_score: 0.8,
    final_score: 0.91,
    formality: "Formal",
    accessories: [
      {
        slot: "watch",
        name: "Silver watch",
        source: "rule",
        reason: "Polishes a formal outfit.",
      },
      {
        slot: "bag",
        name: "Structured black bag",
        source: "rule",
        reason: "Matches the darker base color.",
      },
    ],
  };

  beforeEach(() => {
    cy.intercept("GET", "**/scanning/garments", {
      message: "Found 2 garments",
      garments: outfit.garments,
    });
  });

  it("renders outfit suggestions with accessory recommendations", () => {
    cy.intercept("POST", "**/outfits/generate", (req) => {
      expect(req.body.user_id).to.equal("user-1");
      expect(req.body.occasion).to.equal("Office");
      req.reply({
        message: "Generated 1 outfit(s) for occasion 'Office'",
        occasion: "Office",
        outfits: [outfit],
      });
    }).as("generateSuggestions");

    cy.visitAsUser();
    cy.contains("button", "Suggest").click();
    cy.wait("@generateSuggestions");
    cy.get("[data-cy=suggestions-list]").should("be.visible");
    cy.get("[data-cy=outfit-suggestion-card]").should("have.length", 1);
    cy.contains("Silver watch").should("be.visible");
    cy.contains("Structured black bag").should("be.visible");
    cy.contains("Polishes a formal outfit.").should("be.visible");
  });

  it("sends selected weather condition to outfit suggestions", () => {
    cy.intercept("POST", "**/outfits/generate", (req) => {
      if (req.body.weather) {
        expect(req.body.weather.temperature_c).to.equal(8);
        expect(req.body.weather.style_profile).to.equal("cold_windy");
        expect(req.body.weather.condition).to.equal("cold and windy");
      }
      req.reply({
        message: "Generated 1 outfit(s) for occasion 'Office'",
        occasion: "Office",
        weather: req.body.weather,
        outfits: [outfit],
      });
    }).as("generateSuggestions");

    cy.visitAsUser();
    cy.contains("button", "Suggest").click();
    cy.wait("@generateSuggestions");
    cy.get("[data-cy=weather-choice-list]").should("not.exist");
    cy.get("[data-cy=toggle-weather-choices]").click();
    cy.contains("button", "Standard Suggest")
      .invoke("attr", "class")
      .should("not.contain", "bg-[#FF6FB5]");
    cy.contains("button", "Suggest for Current Weather")
      .invoke("attr", "class")
      .should("not.contain", "bg-[#FF6FB5]");
    cy.get("[data-cy=toggle-weather-choices]")
      .invoke("attr", "class")
      .should("contain", "bg-[#FF6FB5]");
    cy.get("[data-cy=weather-choice-cold]").click();
    cy.contains("button", "Suggest for Current Weather")
      .invoke("attr", "class")
      .should("not.contain", "bg-[#FF6FB5]");
    cy.wait("@generateSuggestions");
    cy.contains("Weather filter: Cold").should("be.visible");
    cy.contains("8°C").should("be.visible");
  });

  it("calls the accessory recommendation endpoint shape directly", () => {
    cy.intercept("POST", "**/recommend/accessories", (req) => {
      expect(req.body.formality).to.equal("Formal");
      expect(req.body.garments).to.have.length(2);
      req.reply({
        accessories: [
          {
            slot: "watch",
            name: "Silver watch",
            source: "rule",
            reason: "Polishes a formal outfit.",
          },
        ],
      });
    }).as("recommendAccessories");

    cy.window().then((win) =>
      win.fetch("http://localhost:8000/recommend/accessories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formality: "Formal",
          garments: outfit.garments,
        }),
      }),
    );
    cy.wait("@recommendAccessories");
  });
});
