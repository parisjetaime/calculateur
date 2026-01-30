import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, Calculator, Coffee, Wine } from "lucide-react";

// Facteurs d'émission par régime (kgCO2e/repas)
const MEAL_REGIMES = [
  { id: "à dominante animale (avec boeuf)", label: "À dominante animale (avec bœuf)", factor: 6.3 },
  { id: "à dominante animale (sans boeuf)", label: "À dominante animale (sans bœuf)", factor: 3.1 },
  { id: "végétarien", label: "Végétarien", factor: 1.1 },
  { id: "végétalien", label: "Végétalien", factor: 0.5 },
];

// Facteur petit-déjeuner/collation
const BREAKFAST_FACTOR = 0.52; // kgCO2e

// Types de vaisselle
const DISHWARE_TYPES = [
  { id: "Réutilisable", label: "Réutilisable", factor: 0 },
  { id: "Jetable en plastique (PET)", label: "Jetable en plastique (PET)", factor: 0.03 },
  { id: "Jetable en carton", label: "Jetable en carton", factor: 0.015 },
];

// Ratio monétaire restauration (kgCO2/k€)
const CATERING_RATIO = 560;

const CateringSection = ({ onSave, initialData, calculatedValues }) => {
  const [formData, setFormData] = useState({
    knows_catering: "Les types et quantités de repas fournis",
    
    // 5.1. Approche par les quantités
    breakfasts: 0,
    snacks: 0,
    meals: [
      { type: "Déjeuner", quantity: 0, regime: "" },
      { type: "Déjeuner", quantity: 0, regime: "" },
      { type: "Dîner", quantity: 0, regime: "" },
      { type: "Dîner", quantity: 0, regime: "" },
    ],
    dishware_breakfast: "",
    dishware_lunch: "",
    dishware_snack: "",
    dishware_dinner: "",
    
    beverages: [
      { name: "Eau en bouteille", quantity: 0, factor: 0.27 },
      { name: "Jus de fruits", quantity: 0, factor: 0.85 },
      { name: "Sodas", quantity: 0, factor: 0.50 },
      { name: "Vin", quantity: 0, factor: 1.2 },
    ],
    
    // 5.2. Dépenses réelles
    catering_expenses: 0,
    
    ...initialData,
  });

  const [calculatedEmissions, setCalculatedEmissions] = useState({
    breakfasts: 0,
    snacks: 0,
    meals_total: 0,
    dishware_total: 0,
    beverages_total: 0,
    quantities_total: 0,
    expenses_total: 0,
    total: 0,
  });

  const totalVisitors = calculatedValues?.total_visitors || 0;

  const getOrientationMessage = () => {
    switch (formData.knows_catering) {
      case "Les types et quantités de repas fournis":
        return "Remplir l'onglet 5.1. Approche par les quantités";
      case "Les dépenses en restauration":
        return "Remplir l'onglet 5.2. Approche par les dépenses réelles";
      default:
        return "Des valeurs moyennes vont être utilisées. Allez directement à l'onglet 6. Hébergements";
    }
  };

  const calculateEmissions = useCallback(() => {
    // Petits-déjeuners et collations
    const breakfastsEmissions = formData.breakfasts * BREAKFAST_FACTOR;
    const snacksEmissions = formData.snacks * BREAKFAST_FACTOR;
    
    // Repas
    const mealsTotal = formData.meals.reduce((sum, meal) => {
      if (!meal.quantity || !meal.regime) return sum;
      const regime = MEAL_REGIMES.find(r => r.id === meal.regime);
      return sum + (meal.quantity * (regime?.factor || 0));
    }, 0);
    
    // Vaisselle (simplifié)
    const dishwareTotal = 0; // À implémenter avec les calculs complets
    
    // Boissons
    const beveragesTotal = formData.beverages.reduce((sum, bev) => 
      sum + (bev.quantity * bev.factor), 0);
    
    const quantitiesTotal = breakfastsEmissions + snacksEmissions + mealsTotal + 
                            dishwareTotal + beveragesTotal;
    
    // Dépenses
    const expensesTotal = (formData.catering_expenses * CATERING_RATIO) / 1000;
    
    // Total selon l'approche choisie
    let total = 0;
    if (formData.knows_catering === "Les types et quantités de repas fournis") {
      total = quantitiesTotal;
    } else if (formData.knows_catering === "Les dépenses en restauration") {
      total = expensesTotal;
    }

    setCalculatedEmissions({
      breakfasts: breakfastsEmissions,
      snacks: snacksEmissions,
      meals_total: mealsTotal,
      dishware_total: dishwareTotal,
      beverages_total: beveragesTotal,
      quantities_total: quantitiesTotal,
      expenses_total: expensesTotal,
      total,
    });
  }, [formData]);

  useEffect(() => {
    calculateEmissions();
  }, [calculateEmissions]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMealChange = (index, field, value) => {
    const newMeals = [...formData.meals];
    newMeals[index] = { ...newMeals[index], [field]: value };
    setFormData(prev => ({ ...prev, meals: newMeals }));
  };

  const handleBeverageChange = (index, field, value) => {
    const newBeverages = [...formData.beverages];
    newBeverages[index] = { ...newBeverages[index], [field]: value };
    setFormData(prev => ({ ...prev, beverages: newBeverages }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ ...formData, total_emissions: calculatedEmissions.total });
    }
  };

  const showQuantities = formData.knows_catering === "Les types et quantités de repas fournis";
  const showExpenses = formData.knows_catering === "Les dépenses en restauration";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* COLONNE GAUCHE - SAISIE */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UtensilsCrossed className="h-5 w-5" />
              5. Restauration - Saisie
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm">Je connais...</Label>
              <div className="col-span-2">
                <Select value={formData.knows_catering} onValueChange={(val) => handleChange('knows_catering', val)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Les types et quantités de repas fournis">Les types et quantités de repas fournis</SelectItem>
                    <SelectItem value="Les dépenses en restauration">Les dépenses en restauration</SelectItem>
                    <SelectItem value="Aucune de ces données">Aucune de ces données</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="bg-[#f0f7f5] border border-[#0d5f4d] rounded-lg p-2">
              <p className="text-xs text-[#0d5f4d]">→ {getOrientationMessage()}</p>
            </div>

            {showQuantities && (
              <>
                {/* Petits-déjeuners et collations */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">5.1. Approche par les quantités</h4>
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Coffee className="h-3 w-3" /> Petits-déjeuners et collations
                  </p>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-xs">Nombre de petit-déjeuners</Label>
                      <Input
                        type="number" min="0"
                        value={formData.breakfasts || ''}
                        onChange={(e) => handleChange('breakfasts', parseInt(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                      <span className="text-xs text-gray-500">unités</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-xs">Nombre de collations</Label>
                      <Input
                        type="number" min="0"
                        value={formData.snacks || ''}
                        onChange={(e) => handleChange('snacks', parseInt(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                      <span className="text-xs text-gray-500">unités</span>
                    </div>
                  </div>
                </div>

                {/* Déjeuners et dîners */}
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-600 mb-2">Déjeuners et dîners</p>
                  <div className="space-y-2">
                    {formData.meals.map((meal, i) => (
                      <div key={i} className="grid grid-cols-4 gap-2 items-center">
                        <Label className="text-xs">{meal.type}</Label>
                        <Input
                          type="number" min="0"
                          value={meal.quantity || ''}
                          onChange={(e) => handleMealChange(i, 'quantity', parseInt(e.target.value) || 0)}
                          className="h-8 text-sm"
                          placeholder="Nb"
                        />
                        <Select 
                          value={meal.regime} 
                          onValueChange={(val) => handleMealChange(i, 'regime', val)}
                        >
                          <SelectTrigger className="h-8 text-xs col-span-2">
                            <SelectValue placeholder="Régime..." />
                          </SelectTrigger>
                          <SelectContent>
                            {MEAL_REGIMES.map(r => (
                              <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Boissons */}
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Wine className="h-3 w-3" /> Boissons
                  </p>
                  <div className="space-y-2">
                    {formData.beverages.map((bev, i) => (
                      <div key={i} className="grid grid-cols-3 gap-2 items-center">
                        <Label className="text-xs">{bev.name}</Label>
                        <Input
                          type="number" min="0"
                          value={bev.quantity || ''}
                          onChange={(e) => handleBeverageChange(i, 'quantity', parseInt(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                        <span className="text-xs text-gray-500">unités</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {showExpenses && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">5.2. Approche par les dépenses</h4>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <Label className="text-xs">Dépenses restauration</Label>
                  <Input
                    type="number" min="0"
                    value={formData.catering_expenses || ''}
                    onChange={(e) => handleChange('catering_expenses', parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                  />
                  <span className="text-xs text-gray-500">€</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* COLONNE DROITE - CALCULS */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#f0f7f5] py-3 border-b border-[#0d5f4d]">
            <CardTitle className="flex items-center gap-2 text-lg text-[#0d5f4d]">
              <Calculator className="h-5 w-5" />
              5. Restauration - Émissions calculées
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {showQuantities && (
              <>
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">5.1. Approche par les quantités</h4>
                <div className="space-y-1 mb-4">
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Petits-déjeuners</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.breakfasts.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Collations</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.snacks.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Repas (déjeuners/dîners)</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.meals_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Boissons</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.beverages_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                    <div className="col-span-7 font-semibold">Total quantités</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.quantities_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>
              </>
            )}

            {showExpenses && (
              <>
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">5.2. Approche par les dépenses</h4>
                <div className="space-y-1 mb-4">
                  <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                    <div className="col-span-7 font-semibold">kgCO2e (ratio monétaire)</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.expenses_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>
              </>
            )}

            <div className="border-t-2 border-[#0d5f4d] pt-3">
              <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded">
                <div className="col-span-7 font-bold">TOTAL RESTAURATION</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d] text-lg">{calculatedEmissions.total.toFixed(1)}</div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {onSave && (
        <div className="mt-6 flex justify-center">
          <Button onClick={handleSave} className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-8 py-3">
            Enregistrer la section Restauration
          </Button>
        </div>
      )}
    </div>
  );
};

export default CateringSection;
