import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Calculator, Plane, Ship } from "lucide-react";

// Facteurs d'émission fret (kgCO2e/t.km)
const FREIGHT_MODES = [
  { id: "Camion articulé 40t PTAC", label: "Camion articulé 40t", factor: 0.085 },
  { id: "Camion porteur 19t PTAC", label: "Camion porteur 19t", factor: 0.120 },
  { id: "Utilitaire < 3,5t", label: "Utilitaire < 3,5t", factor: 0.450 },
  { id: "Avion cargo < 50t, < 500km", label: "Avion cargo court courrier", factor: 2.50 },
  { id: "Avion cargo > 100t, 500-1000km", label: "Avion cargo moyen courrier", factor: 1.40 },
  { id: "Avion cargo > 100t, > 1000km", label: "Avion cargo long courrier", factor: 0.80 },
  { id: "Train fret", label: "Train fret", factor: 0.025 },
  { id: "Bateau porte-conteneurs", label: "Bateau porte-conteneurs", factor: 0.015 },
];

// Ratios monétaires fret (kgCO2/k€)
const FREIGHT_RATIOS = {
  routier_ferroviaire: 340,
  aerien: 1200,
};

const FreightSection = ({ onSave, initialData, calculatedValues }) => {
  const [formData, setFormData] = useState({
    knows_freight: "Les distances parcourues par les marchandises et les types de véhicules",
    
    // 9.1. Approche par les distances
    artworks: [ // Pour événements culturels
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
    ],
    decor: [
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
    ],
    equipment: [
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
    ],
    catering_goods: [
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
    ],
    communication_goods: [
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
    ],
    other_goods: [
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
    ],
    
    // 9.2. Approche par les dépenses
    road_rail_expenses: 0,
    air_expenses: 0,
    
    ...initialData,
  });

  const [calculatedEmissions, setCalculatedEmissions] = useState({
    artworks_total: 0,
    decor_total: 0,
    equipment_total: 0,
    catering_total: 0,
    communication_total: 0,
    other_total: 0,
    distances_total: 0,
    road_rail: 0,
    air: 0,
    expenses_total: 0,
    total: 0,
  });

  const getOrientationMessage = () => {
    switch (formData.knows_freight) {
      case "Les distances parcourues par les marchandises et les types de véhicules":
        return "Remplir l'onglet 9.1. Approche par les distances";
      case "Les dépenses en logistique":
        return "Remplir l'onglet 9.2. Approche par les dépenses";
      default:
        return "Ce poste ne sera pas comptabilisé. Allez directement à l'onglet 10. Déchets";
    }
  };

  const calculateCategoryEmissions = (items) => {
    return items.reduce((sum, item) => {
      if (!item.mode || !item.distance || !item.weight) return sum;
      const mode = FREIGHT_MODES.find(m => m.id === item.mode);
      if (!mode) return sum;
      // Formule: distance × véhicules × poids × facteur / 1000
      return sum + (item.distance * (item.vehicles || 1) * item.weight * mode.factor / 1000);
    }, 0);
  };

  const calculateEmissions = useCallback(() => {
    const artworksTotal = calculateCategoryEmissions(formData.artworks);
    const decorTotal = calculateCategoryEmissions(formData.decor);
    const equipmentTotal = calculateCategoryEmissions(formData.equipment);
    const cateringTotal = calculateCategoryEmissions(formData.catering_goods);
    const communicationTotal = calculateCategoryEmissions(formData.communication_goods);
    const otherTotal = calculateCategoryEmissions(formData.other_goods);
    
    const distancesTotal = artworksTotal + decorTotal + equipmentTotal + 
                           cateringTotal + communicationTotal + otherTotal;
    
    // Dépenses
    const roadRail = (formData.road_rail_expenses * FREIGHT_RATIOS.routier_ferroviaire) / 1000;
    const air = (formData.air_expenses * FREIGHT_RATIOS.aerien) / 1000;
    const expensesTotal = roadRail + air;
    
    let total = 0;
    if (formData.knows_freight === "Les distances parcourues par les marchandises et les types de véhicules") {
      total = distancesTotal;
    } else if (formData.knows_freight === "Les dépenses en logistique") {
      total = expensesTotal;
    }

    setCalculatedEmissions({
      artworks_total: artworksTotal,
      decor_total: decorTotal,
      equipment_total: equipmentTotal,
      catering_total: cateringTotal,
      communication_total: communicationTotal,
      other_total: otherTotal,
      distances_total: distancesTotal,
      road_rail: roadRail,
      air: air,
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
    newArray[index] = { ...newArray[index], [field]: field === 'mode' ? value : (parseFloat(value) || 0) };
    setFormData(prev => ({ ...prev, [arrayName]: newArray }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ ...formData, total_emissions: calculatedEmissions.total });
    }
  };

  const showDistances = formData.knows_freight === "Les distances parcourues par les marchandises et les types de véhicules";
  const showExpenses = formData.knows_freight === "Les dépenses en logistique";

  const renderFreightCategory = (title, arrayName) => (
    <div className="mb-3">
      <p className="text-xs text-gray-600 mb-2">{title}</p>
      {formData[arrayName].map((item, i) => (
        <div key={i} className="grid grid-cols-5 gap-1 items-center mb-1">
          <Select value={item.mode} onValueChange={(val) => handleArrayChange(arrayName, i, 'mode', val)}>
            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Mode..." /></SelectTrigger>
            <SelectContent>
              {FREIGHT_MODES.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="number" min="0" placeholder="km"
            value={item.distance || ''} onChange={(e) => handleArrayChange(arrayName, i, 'distance', e.target.value)}
            className="h-7 text-xs" />
          <Input type="number" min="0" placeholder="Véh."
            value={item.vehicles || ''} onChange={(e) => handleArrayChange(arrayName, i, 'vehicles', e.target.value)}
            className="h-7 text-xs" />
          <Input type="number" min="0" placeholder="kg"
            value={item.weight || ''} onChange={(e) => handleArrayChange(arrayName, i, 'weight', e.target.value)}
            className="h-7 text-xs" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5" />
              9. Fret - Saisie
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm">Je connais...</Label>
              <div className="col-span-2">
                <Select value={formData.knows_freight} onValueChange={(val) => handleChange('knows_freight', val)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Les distances parcourues par les marchandises et les types de véhicules">Les distances et types de véhicules</SelectItem>
                    <SelectItem value="Les dépenses en logistique">Les dépenses en logistique</SelectItem>
                    <SelectItem value="Aucune de ces données">Aucune de ces données</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="bg-[#f0f7f5] border border-[#0d5f4d] rounded-lg p-2">
              <p className="text-xs text-[#0d5f4d]">→ {getOrientationMessage()}</p>
            </div>

            {showDistances && (
              <div className="border-t pt-3 max-h-96 overflow-y-auto">
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">9.1. Approche par les distances</h4>
                {renderFreightCategory("Transport des décors et aménagements", "decor")}
                {renderFreightCategory("Transport du matériel", "equipment")}
                {renderFreightCategory("Transport des produits de restauration", "catering_goods")}
                {renderFreightCategory("Transport supports de communication", "communication_goods")}
                {renderFreightCategory("Autres", "other_goods")}
              </div>
            )}

            {showExpenses && (
              <div className="border-t pt-3">
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">9.2. Approche par les dépenses</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-xs">Fret routier et ferroviaire</Label>
                    <Input type="number" min="0"
                      value={formData.road_rail_expenses || ''}
                      onChange={(e) => handleChange('road_rail_expenses', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm" />
                    <span className="text-xs text-gray-500">€</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-xs">Fret aérien</Label>
                    <Input type="number" min="0"
                      value={formData.air_expenses || ''}
                      onChange={(e) => handleChange('air_expenses', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm" />
                    <span className="text-xs text-gray-500">€</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#f0f7f5] py-3 border-b border-[#0d5f4d]">
            <CardTitle className="flex items-center gap-2 text-lg text-[#0d5f4d]">
              <Calculator className="h-5 w-5" />
              9. Fret - Émissions calculées
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {showDistances && (
              <>
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">9.1. Par les distances</h4>
                <div className="space-y-1 mb-4">
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Décors et aménagements</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.decor_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Matériel</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.equipment_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Restauration</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.catering_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Communication</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.communication_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Autres</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.other_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                    <div className="col-span-7 font-semibold">Total fret</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.distances_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2</div>
                  </div>
                </div>
              </>
            )}

            {showExpenses && (
              <>
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">9.2. Par les dépenses</h4>
                <div className="space-y-1 mb-4">
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Routier et ferroviaire</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.road_rail.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Aérien</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.air.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                    <div className="col-span-7 font-semibold">Total fret</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.expenses_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>
              </>
            )}

            <div className="border-t-2 border-[#0d5f4d] pt-3">
              <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded">
                <div className="col-span-7 font-bold">TOTAL FRET</div>
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
            Enregistrer la section Fret
          </Button>
        </div>
      )}
    </div>
  );
};

export default FreightSection;
