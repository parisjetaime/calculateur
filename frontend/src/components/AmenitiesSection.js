import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Calculator, Plus, Trash2 } from "lucide-react";

// Facteurs d'émission pour les équipements (source: hypotheses/amenagements_accueil/quantites.json)
const EQUIPMENT_FACTORS = {
  "Eau de réseau": { factor: 0.132, unit: "m³" },
  "Radiateur électrique - 1000 W à rayonnement": { factor: 37.5, unit: "unité" },
  "Réfrigérateur - mini-bar - 33l": { factor: 87.6, unit: "unité" },
  "Réfrigérateur - 1 grande porte - 250l": { factor: 300.0, unit: "unité" },
  "Ecran publicitaire - 2m²": { factor: 1321.0, unit: "unité" },
  "Appareil photo compact": { factor: 24.4, unit: "unité" },
  "Photocopieurs": { factor: 2935.0, unit: "unité" },
  "Chaise - bois": { factor: 18.6, unit: "unité" },
  "Chaise - plastique": { factor: 34.4, unit: "unité" },
  "Salon de jardin - bois": { factor: 69.2, unit: "unité" },
  "Salon de jardin - métal": { factor: 238.0, unit: "unité" },
  "Table": { factor: 60.1, unit: "unité" },
  "Canapé - textile": { factor: 179.0, unit: "unité" },
  "Vidéo-projecteur": { factor: 145.0, unit: "unité" },
  "Ordinateur - portable": { factor: 156.0, unit: "unité" },
  "Télévision - 40-49 pouces": { factor: 371.0, unit: "unité" },
  "Climatiseur mobile": { factor: 239.0, unit: "unité" },
  "Machine à café - expresso": { factor: 47.6, unit: "unité" },
  "Tatami de gymnastique": { factor: 62.0, unit: "m²" },
  "Agrès barres assymétriques de gymnastique": { factor: 550.0, unit: "unité" },
  "Panier de basket": { factor: 1900.0, unit: "unité" },
};

// Ratios monétaires pour l'approche par les dépenses
const MONETARY_RATIOS = {
  "Construction": 1380,
  "Informatique et équipements électroniques": 890,
  "Location site": 580,
  "Papier et carton": 920,
  "Accueil": 420,
};

const AmenitiesSection = ({ onSave, initialData, eventData, calculatedValues }) => {
  const [formData, setFormData] = useState({
    knows_details: "Oui",
    
    // 4.1 Approche par les quantités
    equipment_items: [
      { type: "", quantity: 0 },
      { type: "", quantity: 0 },
      { type: "", quantity: 0 },
      { type: "", quantity: 0 },
      { type: "", quantity: 0 },
    ],
    water_consumption: 0,
    
    // 4.2 Approche par les dépenses
    site_rental_cost: 0,
    reception_cost: 0,
    expense_items: [
      { type: "", amount: 0 },
      { type: "", amount: 0 },
      { type: "", amount: 0 },
    ],
    
    ...initialData,
  });

  const [calculatedEmissions, setCalculatedEmissions] = useState({
    equipment_emissions: [],
    water_emissions: 0,
    total_quantities: 0,
    site_rental_emissions: 0,
    reception_emissions: 0,
    expense_emissions: [],
    total_expenses: 0,
    total: 0,
  });

  const eventType = eventData?.event_type || calculatedValues?.event_type || "Evenement_culturel";

  const getOrientationMessage = () => {
    if (formData.knows_details === "Oui") {
      return "Remplir les onglets 4.1 et 4.2. Attention: les valeurs s'ajoutent";
    } else if (eventType === "Evenement_professionnel") {
      return "Des valeurs moyennes vont être utilisées. Allez directement à l'onglet 5.Restauration";
    } else {
      return "Ce poste ne sera pas comptabilisé dans les calculs. Allez directement à l'onglet 5. Restauration";
    }
  };

  const calculateEmissions = useCallback(() => {
    // 4.1 Émissions par quantités
    const equipmentEmissions = formData.equipment_items.map(item => {
      if (!item.type || !item.quantity) return 0;
      const factorData = EQUIPMENT_FACTORS[item.type];
      if (!factorData) return 0;
      return item.quantity * factorData.factor;
    });
    
    const waterEmissions = formData.water_consumption * 0.132;
    const totalQuantities = equipmentEmissions.reduce((sum, e) => sum + e, 0) + waterEmissions;

    // 4.2 Émissions par dépenses
    const siteRentalEmissions = formData.site_rental_cost * 580 / 1000;
    const receptionEmissions = formData.reception_cost * 420 / 1000;
    
    const expenseEmissions = formData.expense_items.map(item => {
      if (!item.type || !item.amount) return 0;
      const ratio = MONETARY_RATIOS[item.type];
      if (!ratio) return 0;
      return item.amount * ratio / 1000;
    });
    const totalExpenses = siteRentalEmissions + receptionEmissions + 
                          expenseEmissions.reduce((sum, e) => sum + e, 0);

    const total = formData.knows_details === "Oui" 
      ? totalQuantities + totalExpenses 
      : 0;

    setCalculatedEmissions({
      equipment_emissions: equipmentEmissions,
      water_emissions: waterEmissions,
      total_quantities: totalQuantities,
      site_rental_emissions: siteRentalEmissions,
      reception_emissions: receptionEmissions,
      expense_emissions: expenseEmissions,
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

  const handleEquipmentChange = (index, field, value) => {
    const newItems = [...formData.equipment_items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, equipment_items: newItems }));
  };

  const handleExpenseChange = (index, field, value) => {
    const newItems = [...formData.expense_items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, expense_items: newItems }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...formData,
        total_emissions: calculatedEmissions.total,
      });
    }
  };

  const showDetails = formData.knows_details === "Oui";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* COLONNE GAUCHE - SAISIE */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Building className="h-5 w-5" />
              4. Aménagements - Saisie des données
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm font-medium">Je connais les types de biens et services</Label>
              <div className="col-span-2">
                <Select 
                  value={formData.knows_details} 
                  onValueChange={(val) => handleChange('knows_details', val)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oui">Oui</SelectItem>
                    <SelectItem value="Non">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-[#f0f7f5] border border-[#0d5f4d] rounded-lg p-3">
              <p className="text-sm text-[#0d5f4d] font-medium">→ {getOrientationMessage()}</p>
            </div>

            {showDetails && (
              <>
                {/* 4.1 Approche par les quantités */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">4.1. Approche par les quantités</h4>
                  
                  <p className="text-xs text-gray-600 mb-2">Équipements et achats divers</p>
                  
                  <div className="space-y-2">
                    {formData.equipment_items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2">
                        <div className="col-span-7">
                          <Select 
                            value={item.type} 
                            onValueChange={(val) => handleEquipmentChange(index, 'type', val)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(EQUIPMENT_FACTORS).map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            min="0"
                            value={item.quantity || ''}
                            onChange={(e) => handleEquipmentChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs"
                            placeholder="Qté"
                          />
                        </div>
                        <div className="col-span-2 text-xs text-gray-500 flex items-center">
                          {item.type ? EQUIPMENT_FACTORS[item.type]?.unit : ''}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">Consommation d'eau</Label>
                    <div className="col-span-2 flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData.water_consumption || ''}
                        onChange={(e) => handleChange('water_consumption', parseFloat(e.target.value) || 0)}
                        className="h-9"
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-500">m³</span>
                    </div>
                  </div>
                </div>

                {/* 4.2 Approche par les dépenses */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">4.2. Approche par les dépenses</h4>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-sm">Location du site</Label>
                      <div className="col-span-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={formData.site_rental_cost || ''}
                          onChange={(e) => handleChange('site_rental_cost', parseFloat(e.target.value) || 0)}
                          className="h-9"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-500">€</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-sm">Service d'accueil</Label>
                      <div className="col-span-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={formData.reception_cost || ''}
                          onChange={(e) => handleChange('reception_cost', parseFloat(e.target.value) || 0)}
                          className="h-9"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-500">€</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mt-2">Autres aménagements</p>
                    
                    {formData.expense_items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2">
                        <div className="col-span-6">
                          <Select 
                            value={item.type} 
                            onValueChange={(val) => handleExpenseChange(index, 'type', val)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Type de dépense..." />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(MONETARY_RATIOS).map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-4">
                          <Input
                            type="number"
                            min="0"
                            value={item.amount || ''}
                            onChange={(e) => handleExpenseChange(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs"
                            placeholder="Montant"
                          />
                        </div>
                        <div className="col-span-2 text-xs text-gray-500 flex items-center">€</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* COLONNE DROITE - CALCULS */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#f0f7f5] py-3 border-b border-[#0d5f4d]">
            <CardTitle className="flex items-center gap-2 text-lg text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Calculator className="h-5 w-5" />
              4. Aménagements - Émissions calculées
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {showDetails ? (
              <>
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">4.1. Approche par les quantités</h4>
                
                <div className="space-y-1 mb-4">
                  {formData.equipment_items.map((item, index) => (
                    item.type && (
                      <div key={index} className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                        <div className="col-span-7">{item.type}</div>
                        <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                          {calculatedEmissions.equipment_emissions[index]?.toFixed(1) || 0}
                        </div>
                        <div className="col-span-2 text-gray-600">kgCO2e</div>
                      </div>
                    )
                  ))}
                  
                  {formData.water_consumption > 0 && (
                    <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                      <div className="col-span-7">Eau de réseau</div>
                      <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                        {calculatedEmissions.water_emissions.toFixed(1)}
                      </div>
                      <div className="col-span-2 text-gray-600">kgCO2e</div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                    <div className="col-span-7 font-semibold">Total quantités</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.total_quantities.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">4.2. Approche par les dépenses</h4>
                
                <div className="space-y-1 mb-4">
                  {formData.site_rental_cost > 0 && (
                    <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                      <div className="col-span-7">Location du site</div>
                      <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                        {calculatedEmissions.site_rental_emissions.toFixed(1)}
                      </div>
                      <div className="col-span-2 text-gray-600">kgCO2e</div>
                    </div>
                  )}
                  
                  {formData.reception_cost > 0 && (
                    <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                      <div className="col-span-7">Service d'accueil</div>
                      <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                        {calculatedEmissions.reception_emissions.toFixed(1)}
                      </div>
                      <div className="col-span-2 text-gray-600">kgCO2e</div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                    <div className="col-span-7 font-semibold">Total dépenses</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.total_expenses.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>

                <div className="border-t-2 border-[#0d5f4d] pt-3">
                  <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded text-sm">
                    <div className="col-span-7 font-bold">TOTAL AMÉNAGEMENTS</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d] text-lg">
                      {calculatedEmissions.total.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
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
            data-testid="save-amenities-btn"
            onClick={handleSave}
            className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-8 py-3 text-base"
          >
            Enregistrer la section Aménagements
          </Button>
        </div>
      )}
    </div>
  );
};

export default AmenitiesSection;
