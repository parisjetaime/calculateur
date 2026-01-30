import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Recycle, Calculator, Trash2 } from "lucide-react";

// Facteurs d'émission déchets (kgCO2e/kg)
const WASTE_FACTORS = {
  "Plastique polypropylène souple": 0.33,
  "Plastique polypropylène rigide": 0.33,
  "Plastique (PET)": 0.27,
  "Textile": 0.32,
  "Papier": 0.13,
  "Carton": 0.13,
  "Aluminium": 0.28,
  "Verre": 0.05,
  "Déchets alimentaires": 0.15,
  "Ameublement (moyen)": 0.25,
  "DEEE (électronique)": 0.45,
  "Déchets verts": 0.10,
  "Ordures ménagères": 0.45,
};

const WasteSection = ({ onSave, initialData, calculatedValues }) => {
  const [formData, setFormData] = useState({
    // Déchets divers
    waste_items: [
      { type: "Ameublement (moyen)", weight: 0 },
      { type: "Plastique (PET)", weight: 0 },
      { type: "Carton", weight: 0 },
      { type: "Papier", weight: 0 },
      { type: "Verre", weight: 0 },
      { type: "Déchets alimentaires", weight: 0 },
    ],
    
    ...initialData,
  });

  const [calculatedEmissions, setCalculatedEmissions] = useState({
    waste_items_emissions: [],
    total: 0,
  });

  const calculateEmissions = useCallback(() => {
    const wasteEmissions = formData.waste_items.map(item => {
      const factor = WASTE_FACTORS[item.type] || 0;
      return item.weight * factor;
    });
    
    const total = wasteEmissions.reduce((sum, e) => sum + e, 0);

    setCalculatedEmissions({
      waste_items_emissions: wasteEmissions,
      total,
    });
  }, [formData]);

  useEffect(() => {
    calculateEmissions();
  }, [calculateEmissions]);

  const handleWasteChange = (index, field, value) => {
    const newWaste = [...formData.waste_items];
    if (field === 'type') {
      newWaste[index] = { ...newWaste[index], type: value };
    } else {
      newWaste[index] = { ...newWaste[index], weight: parseFloat(value) || 0 };
    }
    setFormData(prev => ({ ...prev, waste_items: newWaste }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ ...formData, total_emissions: calculatedEmissions.total });
    }
  };

  const wasteTypes = Object.keys(WASTE_FACTORS);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Recycle className="h-5 w-5" />
              10. Déchets - Saisie
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <p className="text-sm text-gray-600">
              Renseignez les quantités de déchets générés par l'événement.
            </p>
            
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3 flex items-center gap-1">
                <Trash2 className="h-4 w-4" /> Déchets divers
              </h4>
              
              <div className="grid grid-cols-3 gap-2 mb-2 text-xs font-medium text-gray-600">
                <div>Type de déchet</div>
                <div>Poids (kg)</div>
                <div></div>
              </div>
              
              {formData.waste_items.map((item, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 items-center mb-2">
                  <Select value={item.type} onValueChange={(val) => handleWasteChange(i, 'type', val)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {wasteTypes.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number" min="0"
                    value={item.weight || ''}
                    onChange={(e) => handleWasteChange(i, 'weight', e.target.value)}
                    className="h-8 text-sm"
                    placeholder="0"
                  />
                  <span className="text-xs text-[#0d5f4d] font-medium">
                    {calculatedEmissions.waste_items_emissions[i]?.toFixed(2) || 0} kgCO2e
                  </span>
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-500 mt-4 bg-gray-50 p-3 rounded">
              <p className="font-medium mb-1">Note :</p>
              <p>Les émissions liées aux badges, à la vaisselle et aux supports de communication 
              sont calculées automatiquement à partir des données saisies dans les modules précédents.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#f0f7f5] py-3 border-b border-[#0d5f4d]">
            <CardTitle className="flex items-center gap-2 text-lg text-[#0d5f4d]">
              <Calculator className="h-5 w-5" />
              10. Déchets - Émissions calculées
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">Déchets divers</h4>
            <div className="space-y-1 mb-4">
              {formData.waste_items.map((item, i) => (
                item.weight > 0 && (
                  <div key={i} className="grid grid-cols-12 gap-2 py-1 px-2 text-sm hover:bg-gray-50">
                    <div className="col-span-7">{item.type}</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.waste_items_emissions[i]?.toFixed(2) || 0}
                    </div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                )
              ))}
              
              {formData.waste_items.every(item => !item.weight) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucun déchet renseigné
                </p>
              )}
            </div>

            <div className="border-t-2 border-[#0d5f4d] pt-3">
              <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded">
                <div className="col-span-7 font-bold">TOTAL DÉCHETS</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d] text-lg">
                  {calculatedEmissions.total.toFixed(2)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>Rappel :</strong> Les déchets générés par les badges, la vaisselle jetable 
                et les supports de communication papier sont liés aux quantités renseignées dans 
                les modules 7 (Achats), 5 (Restauration) et 8 (Communication).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {onSave && (
        <div className="mt-6 flex justify-center">
          <Button onClick={handleSave} className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-8 py-3">
            Enregistrer la section Déchets
          </Button>
        </div>
      )}
    </div>
  );
};

export default WasteSection;
