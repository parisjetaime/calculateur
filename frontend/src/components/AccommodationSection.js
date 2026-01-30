import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, Calculator } from "lucide-react";

// Types d'hébergement et facteurs d'émission (source: hypotheses/hebergements/facteurs_emissions.json)
const ACCOMMODATION_TYPES = [
  { id: "famille_amis", label: "Chez la famille ou des amis", factor: 0.0 },
  { id: "hotel_0_1", label: "Hôtels 0/1*", factor: 4.73 },
  { id: "hotel_2_3", label: "Hôtels 2/3*", factor: 8.50 },
  { id: "hotel_4_5", label: "Hôtels 4/5*", factor: 14.27 },
  { id: "autre_marchand", label: "Autre hébergement marchand", factor: 10.04 },
];

// Durées moyennes de séjour par type d'événement
const STAY_DURATION = {
  "Evenement_professionnel": { foreigners: 2.5, nationals: 1.8 },
  "Evenement_culturel": { foreigners: 3.0, nationals: 2.0 },
  "Evenement_sportif": { foreigners: 3.5, nationals: 2.2 },
};

const AccommodationSection = ({ onSave, initialData, eventData, calculatedValues }) => {
  const [formData, setFormData] = useState({
    knows_accommodation: "Non",
    
    // 6.1 Approche par les types d'hébergements
    foreigners_distribution: [
      { type: "famille_amis", percentage: 0 },
      { type: "hotel_4_5", percentage: 0 },
      { type: "hotel_2_3", percentage: 0 },
      { type: "hotel_0_1", percentage: 0 },
      { type: "autre_marchand", percentage: 0 },
    ],
    nationals_distribution: [
      { type: "famille_amis", percentage: 0 },
      { type: "hotel_4_5", percentage: 0 },
      { type: "hotel_2_3", percentage: 0 },
      { type: "hotel_0_1", percentage: 0 },
      { type: "autre_marchand", percentage: 0 },
    ],
    
    ...initialData,
  });

  const [calculatedEmissions, setCalculatedEmissions] = useState({
    foreigners_emissions: 0,
    nationals_emissions: 0,
    foreigners_nights: 0,
    nationals_nights: 0,
    total: 0,
  });

  const eventType = eventData?.event_type || calculatedValues?.event_type || "Evenement_culturel";
  const foreignersCount = calculatedValues?.total_foreign || 0;
  const nationalsNonIdfCount = calculatedValues?.total_national_non_idf || 0;

  const getOrientationMessage = () => {
    if (formData.knows_accommodation === "Oui") {
      return "Remplir l'onglet 6.1.Approche par les types d'hébergement";
    }
    return "Des valeurs moyennes vont être utilisées. Allez directement à l'onglet 7.Achats et goodies";
  };

  const calculateEmissions = useCallback(() => {
    const stayDuration = STAY_DURATION[eventType] || STAY_DURATION["Evenement_culturel"];

    if (formData.knows_accommodation === "Oui") {
      // Approche par les types d'hébergement
      let foreignersEmissions = 0;
      formData.foreigners_distribution.forEach(dist => {
        const accType = ACCOMMODATION_TYPES.find(a => a.id === dist.type);
        if (accType && dist.percentage > 0) {
          foreignersEmissions += foreignersCount * (dist.percentage / 100) * stayDuration.foreigners * accType.factor;
        }
      });

      let nationalsEmissions = 0;
      formData.nationals_distribution.forEach(dist => {
        const accType = ACCOMMODATION_TYPES.find(a => a.id === dist.type);
        if (accType && dist.percentage > 0) {
          nationalsEmissions += nationalsNonIdfCount * (dist.percentage / 100) * stayDuration.nationals * accType.factor;
        }
      });

      setCalculatedEmissions({
        foreigners_emissions: foreignersEmissions,
        nationals_emissions: nationalsEmissions,
        foreigners_nights: foreignersCount * stayDuration.foreigners,
        nationals_nights: nationalsNonIdfCount * stayDuration.nationals,
        total: foreignersEmissions + nationalsEmissions,
      });
    } else {
      // Approche statistique par le nombre moyen de nuitées
      const avgFactor = 10.04; // Facteur moyen pour hôtel
      const foreignersNights = foreignersCount * stayDuration.foreigners;
      const nationalsNights = nationalsNonIdfCount * stayDuration.nationals;
      
      const foreignersEmissions = foreignersNights * avgFactor;
      const nationalsEmissions = nationalsNights * avgFactor;

      setCalculatedEmissions({
        foreigners_emissions: foreignersEmissions,
        nationals_emissions: nationalsEmissions,
        foreigners_nights: foreignersNights,
        nationals_nights: nationalsNights,
        total: foreignersEmissions + nationalsEmissions,
      });
    }
  }, [formData, eventType, foreignersCount, nationalsNonIdfCount]);

  useEffect(() => {
    calculateEmissions();
  }, [calculateEmissions]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDistributionChange = (category, index, value) => {
    const field = category === 'foreigners' ? 'foreigners_distribution' : 'nationals_distribution';
    const newDist = [...formData[field]];
    newDist[index] = { ...newDist[index], percentage: parseFloat(value) || 0 };
    setFormData(prev => ({ ...prev, [field]: newDist }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...formData,
        total_emissions: calculatedEmissions.total,
      });
    }
  };

  const showDetails = formData.knows_accommodation === "Oui";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* COLONNE GAUCHE - SAISIE */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Hotel className="h-5 w-5" />
              6. Hébergements - Saisie des données
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm font-medium">Je connais les types d'hébergement</Label>
              <div className="col-span-2">
                <Select 
                  value={formData.knows_accommodation} 
                  onValueChange={(val) => handleChange('knows_accommodation', val)}
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
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">6.1. Approche par les types d'hébergements</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Étrangers */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2 font-medium">Étrangers (%)</p>
                    {formData.foreigners_distribution.map((dist, index) => {
                      const accType = ACCOMMODATION_TYPES.find(a => a.id === dist.type);
                      return (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <Label className="text-xs w-32 truncate">{accType?.label}</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={dist.percentage || ''}
                            onChange={(e) => handleDistributionChange('foreigners', index, e.target.value)}
                            className="h-8 w-20 text-xs"
                            placeholder="0"
                          />
                          <span className="text-xs text-gray-500">%</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Nationaux */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2 font-medium">Nationaux non IDF (%)</p>
                    {formData.nationals_distribution.map((dist, index) => {
                      const accType = ACCOMMODATION_TYPES.find(a => a.id === dist.type);
                      return (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <Label className="text-xs w-32 truncate">{accType?.label}</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={dist.percentage || ''}
                            onChange={(e) => handleDistributionChange('nationals', index, e.target.value)}
                            className="h-8 w-20 text-xs"
                            placeholder="0"
                          />
                          <span className="text-xs text-gray-500">%</span>
                        </div>
                      );
                    })}
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
              6. Hébergements - Émissions calculées
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-1 mb-4">
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Nuitées étrangers</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.foreigners_nights.toFixed(0)}
                </div>
                <div className="col-span-2 text-gray-600">nuitées</div>
              </div>
              
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Émissions étrangers</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.foreigners_emissions.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>

              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Nuitées nationaux non IDF</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.nationals_nights.toFixed(0)}
                </div>
                <div className="col-span-2 text-gray-600">nuitées</div>
              </div>
              
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Émissions nationaux non IDF</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.nationals_emissions.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
            </div>

            <div className="border-t-2 border-[#0d5f4d] pt-3">
              <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded text-sm">
                <div className="col-span-7 font-bold">TOTAL HÉBERGEMENTS</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d] text-lg">
                  {calculatedEmissions.total.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {onSave && (
        <div className="mt-6 flex justify-center">
          <Button
            data-testid="save-accommodation-btn"
            onClick={handleSave}
            className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-8 py-3 text-base"
          >
            Enregistrer la section Hébergements
          </Button>
        </div>
      )}
    </div>
  );
};

export default AccommodationSection;
