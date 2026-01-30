import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Calculator, Droplets, Tv, Sofa } from "lucide-react";

// Ratio monétaire pour aménagements (kgCO2/k€)
const AMENAGEMENT_RATIO = 340; // Location site
const ACCUEIL_RATIO = 340; // Service accueil

const AmenitiesSection = ({ onSave, initialData, calculatedValues }) => {
  const [formData, setFormData] = useState({
    knows_purchases: "Oui",
    
    // 4.1.1. Achats divers
    electromenager: [
      { item: "Radiateur électrique - 1000 W", quantity: 0, unit_co2: 37.5 },
      { item: "Réfrigérateur - mini-bar - 33l", quantity: 0, unit_co2: 60 },
      { item: "Réfrigérateur - 1 grande porte - 250l", quantity: 0, unit_co2: 260 },
    ],
    electronique: [
      { item: "Ecran publicitaire - 2m²", quantity: 0, unit_co2: 830 },
      { item: "Appareil photo compact", quantity: 0, unit_co2: 30 },
      { item: "Photocopieurs", quantity: 0, unit_co2: 250 },
    ],
    mobilier: [
      { item: "Chaise - bois", quantity: 0, unit_co2: 18 },
      { item: "Salon de jardin - bois", quantity: 0, unit_co2: 80 },
      { item: "Chaise - plastique", quantity: 0, unit_co2: 20 },
    ],
    water_m3: 0,
    water_factor: 0.132, // kgCO2e/m3
    
    // 4.1.2. Construction infrastructures
    infrastructures: [
      { item: "Bâtiment agricole - structure béton", quantity: 0, unit_co2: 800 },
      { item: "Centre de loisir - structure métallique", quantity: 0, unit_co2: 600 },
    ],
    
    // 4.2. Approche par les dépenses
    site_rental_euros: 0,
    reception_service_euros: 0,
    other_expenses: [
      { type: "Construction", amount: 0 },
      { type: "Informatique et équipements électroniques", amount: 0 },
      { type: "Papier et carton", amount: 0 },
    ],
    
    ...initialData,
  });

  const [calculatedEmissions, setCalculatedEmissions] = useState({
    electromenager_total: 0,
    electronique_total: 0,
    mobilier_total: 0,
    water_total: 0,
    infrastructure_total: 0,
    quantities_total: 0,
    site_rental: 0,
    reception_service: 0,
    other_expenses_total: 0,
    expenses_total: 0,
    total: 0,
  });

  const getOrientationMessage = () => {
    if (formData.knows_purchases === "Oui") {
      return "Remplir les onglets 4.1 et 4.2. Attention: les valeurs s'ajoutent";
    }
    return "Des valeurs moyennes vont être utilisées. Allez directement à l'onglet 5. Restauration";
  };

  const calculateEmissions = useCallback(() => {
    // Électroménager
    const electromenagerTotal = formData.electromenager.reduce((sum, item) => 
      sum + (item.quantity * item.unit_co2), 0);
    
    // Électronique
    const electroniqueTotal = formData.electronique.reduce((sum, item) => 
      sum + (item.quantity * item.unit_co2), 0);
    
    // Mobilier
    const mobilierTotal = formData.mobilier.reduce((sum, item) => 
      sum + (item.quantity * item.unit_co2), 0);
    
    // Eau
    const waterTotal = formData.water_m3 * formData.water_factor;
    
    // Infrastructures
    const infrastructureTotal = formData.infrastructures.reduce((sum, item) => 
      sum + (item.quantity * item.unit_co2), 0);
    
    const quantitiesTotal = electromenagerTotal + electroniqueTotal + mobilierTotal + 
                            waterTotal + infrastructureTotal;

    // Dépenses
    const siteRental = (formData.site_rental_euros * AMENAGEMENT_RATIO) / 1000;
    const receptionService = (formData.reception_service_euros * ACCUEIL_RATIO) / 1000;
    const otherExpensesTotal = formData.other_expenses.reduce((sum, exp) => 
      sum + (exp.amount * AMENAGEMENT_RATIO / 1000), 0);
    
    const expensesTotal = siteRental + receptionService + otherExpensesTotal;
    
    const total = formData.knows_purchases === "Oui" 
      ? quantitiesTotal + expensesTotal 
      : 0;

    setCalculatedEmissions({
      electromenager_total: electromenagerTotal,
      electronique_total: electroniqueTotal,
      mobilier_total: mobilierTotal,
      water_total: waterTotal,
      infrastructure_total: infrastructureTotal,
      quantities_total: quantitiesTotal,
      site_rental: siteRental,
      reception_service: receptionService,
      other_expenses_total: otherExpensesTotal,
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

  const handleArrayChange = (arrayName, index, field, value) => {
    const newArray = [...formData[arrayName]];
    newArray[index] = { ...newArray[index], [field]: value };
    setFormData(prev => ({ ...prev, [arrayName]: newArray }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ ...formData, total_emissions: calculatedEmissions.total });
    }
  };

  const showForm = formData.knows_purchases === "Oui";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* COLONNE GAUCHE - SAISIE */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              4. Aménagements et accueil - Saisie
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm">Je connais les types de biens et services</Label>
              <div className="col-span-2">
                <Select value={formData.knows_purchases} onValueChange={(val) => handleChange('knows_purchases', val)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oui">Oui</SelectItem>
                    <SelectItem value="Non">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="bg-[#f0f7f5] border border-[#0d5f4d] rounded-lg p-2">
              <p className="text-xs text-[#0d5f4d]">→ {getOrientationMessage()}</p>
            </div>

            {showForm && (
              <>
                {/* 4.1.1. Achats divers - Électroménager */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">4.1.1. Achats divers</h4>
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Tv className="h-3 w-3" /> Électroménager
                  </p>
                  {formData.electromenager.map((item, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 items-center mb-2">
                      <Label className="text-xs">{item.item}</Label>
                      <Input
                        type="number" min="0"
                        value={item.quantity || ''}
                        onChange={(e) => handleArrayChange('electromenager', i, 'quantity', parseInt(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                      <span className="text-xs text-gray-500">{item.unit_co2} kgCO2e/unité</span>
                    </div>
                  ))}
                </div>

                {/* Mobilier */}
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Sofa className="h-3 w-3" /> Mobilier
                  </p>
                  {formData.mobilier.map((item, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 items-center mb-2">
                      <Label className="text-xs">{item.item}</Label>
                      <Input
                        type="number" min="0"
                        value={item.quantity || ''}
                        onChange={(e) => handleArrayChange('mobilier', i, 'quantity', parseInt(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                      <span className="text-xs text-gray-500">{item.unit_co2} kgCO2e/unité</span>
                    </div>
                  ))}
                </div>

                {/* Eau */}
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Droplets className="h-3 w-3" /> Eau du réseau
                  </p>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-xs">Consommation d'eau</Label>
                    <Input
                      type="number" min="0"
                      value={formData.water_m3 || ''}
                      onChange={(e) => handleChange('water_m3', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                    />
                    <span className="text-xs text-gray-500">m³</span>
                  </div>
                </div>

                {/* 4.2. Dépenses */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">4.2. Approche par les dépenses</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-xs">Location du site</Label>
                      <Input
                        type="number" min="0"
                        value={formData.site_rental_euros || ''}
                        onChange={(e) => handleChange('site_rental_euros', parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                      <span className="text-xs text-gray-500">€</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-xs">Service d'accueil</Label>
                      <Input
                        type="number" min="0"
                        value={formData.reception_service_euros || ''}
                        onChange={(e) => handleChange('reception_service_euros', parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                      <span className="text-xs text-gray-500">€</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* COLONNE DROITE - CALCULS */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#f0f7f5] py-3 border-b border-[#0d5f4d]">
            <CardTitle className="flex items-center gap-2 text-lg text-[#0d5f4d]">
              <Calculator className="h-5 w-5" />
              4. Aménagements - Émissions calculées
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {showForm ? (
              <>
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">4.1. Approche par les quantités</h4>
                <div className="space-y-1 mb-4">
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Électroménager</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.electromenager_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Mobilier</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.mobilier_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Eau du réseau</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.water_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                    <div className="col-span-7 font-semibold">Total quantités</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.quantities_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">4.2. Approche par les dépenses</h4>
                <div className="space-y-1 mb-4">
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Location du site</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.site_rental.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Service d'accueil</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.reception_service.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                    <div className="col-span-7 font-semibold">Total dépenses</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.expenses_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>

                <div className="border-t-2 border-[#0d5f4d] pt-3">
                  <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded">
                    <div className="col-span-7 font-bold">TOTAL AMÉNAGEMENTS</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d] text-lg">{calculatedEmissions.total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Ce poste ne sera pas comptabilisé.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {onSave && (
        <div className="mt-6 flex justify-center">
          <Button onClick={handleSave} className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-8 py-3">
            Enregistrer la section Aménagements
          </Button>
        </div>
      )}
    </div>
  );
};

export default AmenitiesSection;
