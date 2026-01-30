import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, Calculator } from "lucide-react";

// Facteurs d'émission pour les régimes (source: hypotheses/restauration/regimes.json)
const MEAL_REGIMES = [
  { id: "a_dominante_animale_avec_boeuf", label: "À dominante animale (avec boeuf)", factor: 7.26 },
  { id: "a_dominante_animale_avec_poulet", label: "À dominante animale (avec poulet)", factor: 1.58 },
  { id: "a_dominante_vegetale_avec_boeuf", label: "À dominante végétale (avec boeuf)", factor: 2.01 },
  { id: "a_dominante_vegetale_avec_poulet", label: "À dominante végétale (avec poulet)", factor: 0.80 },
  { id: "classique_avec_boeuf", label: "Classique (avec boeuf)", factor: 6.29 },
  { id: "classique_avec_poulet", label: "Classique (avec poulet)", factor: 1.35 },
  { id: "moyen", label: "Moyen", factor: 2.04 },
  { id: "vegetarien", label: "Végétarien", factor: 0.51 },
];

// Facteur pour petit-déjeuner et collation (kgCO2e par repas)
const BREAKFAST_FACTOR = 0.51;

// Types de vaisselle
const DISHWARE_TYPES = [
  { id: "reutilisable", label: "Réutilisable (lave-vaisselle)", factor: 0.05 },
  { id: "jetable_plastique", label: "Jetable en plastique (PET)", factor: 0.15 },
  { id: "jetable_carton", label: "Jetable en carton", factor: 0.08 },
];

// Ratio monétaire pour l'approche par les dépenses
const MONETARY_RATIO = 1430; // kgCO2e/k€

const CateringSection = ({ onSave, initialData, eventData, calculatedValues }) => {
  const [formData, setFormData] = useState({
    knows_data: "Les types et quantités de repas fournis",
    
    // 5.1 Approche par les quantités
    breakfast_count: 0,
    snack_count: 0,
    meals: [
      { type: "Déjeuner", count: 0, regime: "" },
      { type: "Déjeuner", count: 0, regime: "" },
      { type: "Dîner", count: 0, regime: "" },
      { type: "Dîner", count: 0, regime: "" },
    ],
    dishware_breakfast: "",
    dishware_lunch: "",
    dishware_snack: "",
    dishware_dinner: "",
    
    // Boissons
    beverages: [
      { type: "", quantity: 0 },
      { type: "", quantity: 0 },
    ],
    
    // 5.2 Approche par les dépenses
    catering_expenses: 0,
    
    ...initialData,
  });

  const [calculatedEmissions, setCalculatedEmissions] = useState({
    breakfast_emissions: 0,
    snack_emissions: 0,
    meal_emissions: [],
    dishware_emissions: 0,
    beverage_emissions: 0,
    total_quantities: 0,
    total_expenses: 0,
    total: 0,
  });

  const eventType = eventData?.event_type || calculatedValues?.event_type || "Evenement_culturel";

  const getOrientationMessage = () => {
    if (formData.knows_data === "Les types et quantités de repas fournis") {
      return "Remplir l'onglet 5.1.Approche par les quantités";
    } else if (formData.knows_data === "Les dépenses en restauration") {
      return "Remplir l'onglet 5.2. Approche par les dépenses réelles";
    } else if (eventType === "Evenement_professionnel") {
      return "Des valeurs moyennes vont être utilisées. Allez directement à l'onglet 6. Hébergements";
    }
    return "Ce poste ne sera pas comptabilisé dans les calculs. Allez directement à l'onglet 6. Hébergement";
  };

  const calculateEmissions = useCallback(() => {
    // Petit-déjeuner et collations
    const breakfastEmissions = formData.breakfast_count * BREAKFAST_FACTOR;
    const snackEmissions = formData.snack_count * BREAKFAST_FACTOR;

    // Repas (déjeuners et dîners)
    const mealEmissions = formData.meals.map(meal => {
      if (!meal.count || !meal.regime) return 0;
      const regime = MEAL_REGIMES.find(r => r.id === meal.regime);
      return regime ? meal.count * regime.factor : 0;
    });

    // Vaisselle
    let dishwareEmissions = 0;
    const totalMeals = formData.meals.reduce((sum, m) => sum + (m.count || 0), 0);
    if (formData.dishware_lunch) {
      const dishware = DISHWARE_TYPES.find(d => d.id === formData.dishware_lunch);
      dishwareEmissions += dishware ? totalMeals * dishware.factor : 0;
    }

    const totalQuantities = breakfastEmissions + snackEmissions + 
                            mealEmissions.reduce((sum, e) => sum + e, 0) + 
                            dishwareEmissions;

    // Approche par les dépenses
    const totalExpenses = formData.catering_expenses * MONETARY_RATIO / 1000;

    // Total selon l'approche choisie
    let total = 0;
    if (formData.knows_data === "Les types et quantités de repas fournis") {
      total = totalQuantities;
    } else if (formData.knows_data === "Les dépenses en restauration") {
      total = totalExpenses;
    }

    setCalculatedEmissions({
      breakfast_emissions: breakfastEmissions,
      snack_emissions: snackEmissions,
      meal_emissions: mealEmissions,
      dishware_emissions: dishwareEmissions,
      beverage_emissions: 0,
      total_quantities: totalQuantities,
      total_expenses: totalExpenses,
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

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...formData,
        total_emissions: calculatedEmissions.total,
      });
    }
  };

  const showQuantities = formData.knows_data === "Les types et quantités de repas fournis";
  const showExpenses = formData.knows_data === "Les dépenses en restauration";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* COLONNE GAUCHE - SAISIE */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <UtensilsCrossed className="h-5 w-5" />
              5. Restauration - Saisie des données
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm font-medium">Je connais...</Label>
              <div className="col-span-2">
                <Select 
                  value={formData.knows_data} 
                  onValueChange={(val) => handleChange('knows_data', val)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Les types et quantités de repas fournis">Les types et quantités de repas fournis</SelectItem>
                    <SelectItem value="Les dépenses en restauration">Les dépenses en restauration</SelectItem>
                    <SelectItem value="Aucune de ces données">Aucune de ces données</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-[#f0f7f5] border border-[#0d5f4d] rounded-lg p-3">
              <p className="text-sm text-[#0d5f4d] font-medium">→ {getOrientationMessage()}</p>
            </div>

            {showQuantities && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">5.1. Approche par les quantités</h4>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">Nombre de petits-déjeuners</Label>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData.breakfast_count || ''}
                        onChange={(e) => handleChange('breakfast_count', parseInt(e.target.value) || 0)}
                        className="h-9"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">Nombre de collations</Label>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData.snack_count || ''}
                        onChange={(e) => handleChange('snack_count', parseInt(e.target.value) || 0)}
                        className="h-9"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mt-3">Déjeuners et dîners</p>
                  
                  {formData.meals.map((meal, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <div className="col-span-3">
                        <Select 
                          value={meal.type} 
                          onValueChange={(val) => handleMealChange(index, 'type', val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Déjeuner">Déjeuner</SelectItem>
                            <SelectItem value="Dîner">Dîner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min="0"
                          value={meal.count || ''}
                          onChange={(e) => handleMealChange(index, 'count', parseInt(e.target.value) || 0)}
                          className="h-8 text-xs"
                          placeholder="Nombre"
                        />
                      </div>
                      <div className="col-span-6">
                        <Select 
                          value={meal.regime} 
                          onValueChange={(val) => handleMealChange(index, 'regime', val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Régime..." />
                          </SelectTrigger>
                          <SelectContent>
                            {MEAL_REGIMES.map(regime => (
                              <SelectItem key={regime.id} value={regime.id}>{regime.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}

                  <p className="text-xs text-gray-600 mt-3">Type de vaisselle</p>
                  
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">Vaisselle déjeuner</Label>
                    <div className="col-span-2">
                      <Select 
                        value={formData.dishware_lunch} 
                        onValueChange={(val) => handleChange('dishware_lunch', val)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {DISHWARE_TYPES.map(type => (
                            <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showExpenses && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">5.2. Approche par les dépenses réelles</h4>
                
                <div className="grid grid-cols-3 gap-2 items-center">
                  <Label className="text-sm">Dépenses restauration</Label>
                  <div className="col-span-2 flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={formData.catering_expenses || ''}
                      onChange={(e) => handleChange('catering_expenses', parseFloat(e.target.value) || 0)}
                      className="h-9"
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-500">€</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* COLONNE DROITE - CALCULS */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#f0f7f5] py-3 border-b border-[#0d5f4d]">
            <CardTitle className="flex items-center gap-2 text-lg text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Calculator className="h-5 w-5" />
              5. Restauration - Émissions calculées
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {(showQuantities || showExpenses) ? (
              <>
                {showQuantities && (
                  <>
                    <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">5.1. Approche par les quantités</h4>
                    
                    <div className="space-y-1 mb-4">
                      <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                        <div className="col-span-7">Petits-déjeuners</div>
                        <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                          {calculatedEmissions.breakfast_emissions.toFixed(1)}
                        </div>
                        <div className="col-span-2 text-gray-600">kgCO2e</div>
                      </div>
                      
                      <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                        <div className="col-span-7">Collations</div>
                        <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                          {calculatedEmissions.snack_emissions.toFixed(1)}
                        </div>
                        <div className="col-span-2 text-gray-600">kgCO2e</div>
                      </div>

                      {formData.meals.map((meal, index) => (
                        meal.count > 0 && (
                          <div key={index} className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                            <div className="col-span-7">{meal.type} ({meal.count})</div>
                            <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                              {calculatedEmissions.meal_emissions[index]?.toFixed(1) || 0}
                            </div>
                            <div className="col-span-2 text-gray-600">kgCO2e</div>
                          </div>
                        )
                      ))}
                      
                      <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                        <div className="col-span-7 font-semibold">Total quantités</div>
                        <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                          {calculatedEmissions.total_quantities.toFixed(1)}
                        </div>
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
                        <div className="col-span-7 font-semibold">Émissions (ratio monétaire)</div>
                        <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                          {calculatedEmissions.total_expenses.toFixed(1)}
                        </div>
                        <div className="col-span-2 text-gray-600">kgCO2e</div>
                      </div>
                    </div>
                  </>
                )}

                <div className="border-t-2 border-[#0d5f4d] pt-3">
                  <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded text-sm">
                    <div className="col-span-7 font-bold">TOTAL RESTAURATION</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d] text-lg">
                      {calculatedEmissions.total.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Ce poste ne sera pas comptabilisé.</p>
                <p className="text-sm">Passez au module suivant.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {onSave && (
        <div className="mt-6 flex justify-center">
          <Button
            data-testid="save-catering-btn"
            onClick={handleSave}
            className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-8 py-3 text-base"
          >
            Enregistrer la section Restauration
          </Button>
        </div>
      )}
    </div>
  );
};

export default CateringSection;
