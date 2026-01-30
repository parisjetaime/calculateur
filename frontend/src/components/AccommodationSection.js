import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, Calculator } from "lucide-react";

// Facteurs d'émission par type d'hébergement (kgCO2e/nuitée)
const ACCOMMODATION_FACTORS = {
  "famille_amis": 5.0,
  "hotel_4_5": 25.7,
  "hotel_2_3": 15.4,
  "hotel_0_1": 8.5,
  "autre_marchand": 12.0,
};

const AccommodationSection = ({ onSave, initialData, calculatedValues }) => {
  const [formData, setFormData] = useState({
    knows_accommodation: "Non",
    
    // 6.1. Par types d'hébergements
    foreigners_pct: {
      famille_amis: 0,
      hotel_4_5: 0,
      hotel_2_3: 0,
      hotel_0_1: 0,
      autre_marchand: 0,
    },
    nationals_pct: {
      famille_amis: 0,
      hotel_4_5: 0,
      hotel_2_3: 0,
      hotel_0_1: 0,
      autre_marchand: 0,
    },
    
    ...initialData,
  });

  const [calculatedEmissions, setCalculatedEmissions] = useState({
    foreigners_total: 0,
    nationals_total: 0,
    total: 0,
  });

  // Récupérer les valeurs calculées du module Général
  const totalForeign = calculatedValues?.total_foreign || 0;
  const totalNationalNonIdf = calculatedValues?.total_national_non_idf || 0;
  const eventDuration = calculatedValues?.event_duration || 1;

  const getOrientationMessage = () => {
    if (formData.knows_accommodation === "Oui") {
      return "Remplir l'onglet 6.1. Approche par les types d'hébergement";
    }
    return "Des valeurs moyennes vont être utilisées. Allez directement à l'onglet 7. Achats et goodies";
  };

  const calculateEmissions = useCallback(() => {
    // Nuitées moyennes (simplifié)
    const nightsPerPerson = eventDuration - 1 > 0 ? eventDuration - 1 : 1;
    
    // Émissions étrangers
    let foreignersTotal = 0;
    Object.entries(formData.foreigners_pct).forEach(([type, pct]) => {
      const factor = ACCOMMODATION_FACTORS[type] || 0;
      foreignersTotal += (totalForeign * (pct / 100) * nightsPerPerson * factor);
    });
    
    // Émissions nationaux
    let nationalsTotal = 0;
    Object.entries(formData.nationals_pct).forEach(([type, pct]) => {
      const factor = ACCOMMODATION_FACTORS[type] || 0;
      nationalsTotal += (totalNationalNonIdf * (pct / 100) * nightsPerPerson * factor);
    });
    
    const total = formData.knows_accommodation === "Oui" 
      ? foreignersTotal + nationalsTotal 
      : 0;

    setCalculatedEmissions({
      foreigners_total: foreignersTotal,
      nationals_total: nationalsTotal,
      total,
    });
  }, [formData, totalForeign, totalNationalNonIdf, eventDuration]);

  useEffect(() => {
    calculateEmissions();
  }, [calculateEmissions]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePctChange = (group, type, value) => {
    setFormData(prev => ({
      ...prev,
      [group]: { ...prev[group], [type]: parseFloat(value) || 0 }
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ ...formData, total_emissions: calculatedEmissions.total });
    }
  };

  const showForm = formData.knows_accommodation === "Oui";

  const accommodationTypes = [
    { id: "famille_amis", label: "Chez la famille ou des amis" },
    { id: "hotel_4_5", label: "Hôtels 4/5*" },
    { id: "hotel_2_3", label: "Hôtels 2/3*" },
    { id: "hotel_0_1", label: "Hôtels 0/1*" },
    { id: "autre_marchand", label: "Autre hébergement marchand" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hotel className="h-5 w-5" />
              6. Hébergements - Saisie
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm">Je connais les types d'hébergement</Label>
              <div className="col-span-2">
                <Select value={formData.knows_accommodation} onValueChange={(val) => handleChange('knows_accommodation', val)}>
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
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">6.1. Par types d'hébergements</h4>
                
                <div className="grid grid-cols-3 gap-2 mb-2 text-xs font-medium text-gray-600">
                  <div></div>
                  <div>Étrangers (%)</div>
                  <div>Nationaux non IDF (%)</div>
                </div>
                
                {accommodationTypes.map(type => (
                  <div key={type.id} className="grid grid-cols-3 gap-2 items-center mb-2">
                    <Label className="text-xs">{type.label}</Label>
                    <Input
                      type="number" min="0" max="100"
                      value={formData.foreigners_pct[type.id] || ''}
                      onChange={(e) => handlePctChange('foreigners_pct', type.id, e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number" min="0" max="100"
                      value={formData.nationals_pct[type.id] || ''}
                      onChange={(e) => handlePctChange('nationals_pct', type.id, e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#f0f7f5] py-3 border-b border-[#0d5f4d]">
            <CardTitle className="flex items-center gap-2 text-lg text-[#0d5f4d]">
              <Calculator className="h-5 w-5" />
              6. Hébergements - Émissions calculées
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {showForm ? (
              <>
                <div className="space-y-1 mb-4">
                  <div className="grid grid-cols-12 gap-2 py-2 px-2 text-sm">
                    <div className="col-span-7">Étrangers</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.foreigners_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-2 px-2 text-sm">
                    <div className="col-span-7">Nationaux non IDF</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.nationals_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>
                <div className="border-t-2 border-[#0d5f4d] pt-3">
                  <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded">
                    <div className="col-span-7 font-bold">TOTAL HÉBERGEMENTS</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d] text-lg">{calculatedEmissions.total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Hotel className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Valeurs moyennes utilisées.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {onSave && (
        <div className="mt-6 flex justify-center">
          <Button onClick={handleSave} className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-8 py-3">
            Enregistrer la section Hébergements
          </Button>
        </div>
      )}
    </div>
  );
};

export default AccommodationSection;
