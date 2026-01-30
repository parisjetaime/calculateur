import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Calculator, Recycle } from "lucide-react";

// Types de déchets et facteurs d'émission (source: hypotheses/dechets)
const WASTE_TYPES = [
  { id: "plastique_pp_souple", label: "Plastique polypropylène souple", factor: 0.158 },
  { id: "plastique_pp_rigide", label: "Plastique polypropylène rigide", factor: 0.205 },
  { id: "plastique_pet", label: "Plastique PET", factor: 0.198 },
  { id: "textile", label: "Textile", factor: 0.256 },
  { id: "papier", label: "Papier", factor: 0.089 },
  { id: "carton", label: "Carton", factor: 0.089 },
  { id: "aluminium", label: "Aluminium", factor: 0.165 },
  { id: "verre", label: "Verre", factor: 0.025 },
  { id: "ameublement", label: "Ameublement (moyen)", factor: 0.450 },
  { id: "alimentaire", label: "Déchets alimentaires", factor: 0.085 },
  { id: "electronique", label: "Équipements électroniques", factor: 0.890 },
];

const WasteSection = ({ onSave, initialData, eventData, calculatedValues }) => {
  const [formData, setFormData] = useState({
    // Badges (calculés automatiquement depuis le module 7)
    badges_plastic_soft_kg: 0,
    badges_plastic_rigid_kg: 0,
    badges_textile_kg: 0,
    badges_paper_kg: 0,
    badges_aluminum_kg: 0,
    
    // Vaisselle (calculés automatiquement depuis le module 5)
    dishware_plastic_kg: 0,
    dishware_cardboard_kg: 0,
    
    // Communication (calculés automatiquement depuis le module 8)
    comm_paper_kg: 0,
    comm_plastic_kg: 0,
    comm_aluminum_kg: 0,
    
    // Déchets divers (saisie manuelle)
    misc_waste: [
      { type: "", weight: 0 },
      { type: "", weight: 0 },
      { type: "", weight: 0 },
      { type: "", weight: 0 },
      { type: "", weight: 0 },
    ],
    
    ...initialData,
  });

  const [calculatedEmissions, setCalculatedEmissions] = useState({
    badges_emissions: 0,
    dishware_emissions: 0,
    communication_emissions: 0,
    misc_emissions: [],
    total_badges: 0,
    total_dishware: 0,
    total_communication: 0,
    total_misc: 0,
    total: 0,
  });

  const calculateEmissions = useCallback(() => {
    // Émissions badges
    const badgesEmissions = 
      formData.badges_plastic_soft_kg * 0.158 +
      formData.badges_plastic_rigid_kg * 0.205 +
      formData.badges_textile_kg * 0.256 +
      formData.badges_paper_kg * 0.089 +
      formData.badges_aluminum_kg * 0.165;

    // Émissions vaisselle
    const dishwareEmissions = 
      formData.dishware_plastic_kg * 0.198 +
      formData.dishware_cardboard_kg * 0.089;

    // Émissions communication
    const communicationEmissions = 
      formData.comm_paper_kg * 0.089 +
      formData.comm_plastic_kg * 0.205 +
      formData.comm_aluminum_kg * 0.165;

    // Émissions déchets divers
    const miscEmissions = formData.misc_waste.map(item => {
      if (!item.type || !item.weight) return 0;
      const wasteType = WASTE_TYPES.find(w => w.id === item.type);
      return wasteType ? item.weight * wasteType.factor : 0;
    });
    const totalMisc = miscEmissions.reduce((sum, e) => sum + e, 0);

    const total = badgesEmissions + dishwareEmissions + communicationEmissions + totalMisc;

    setCalculatedEmissions({
      badges_emissions: badgesEmissions,
      dishware_emissions: dishwareEmissions,
      communication_emissions: communicationEmissions,
      misc_emissions: miscEmissions,
      total_badges: badgesEmissions,
      total_dishware: dishwareEmissions,
      total_communication: communicationEmissions,
      total_misc: totalMisc,
      total,
    });
  }, [formData]);

  useEffect(() => {
    calculateEmissions();
  }, [calculateEmissions]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMiscChange = (index, field, value) => {
    const newArray = [...formData.misc_waste];
    newArray[index] = { ...newArray[index], [field]: value };
    setFormData(prev => ({ ...prev, misc_waste: newArray }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...formData,
        total_emissions: calculatedEmissions.total,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* COLONNE GAUCHE - SAISIE */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Recycle className="h-5 w-5" />
              10. Déchets - Saisie des données
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Info message */}
            <div className="bg-[#f0f7f5] border border-[#0d5f4d] rounded-lg p-3">
              <p className="text-sm text-[#0d5f4d] font-medium">
                Les déchets des badges, vaisselle et supports de communication sont calculés automatiquement 
                à partir des données saisies dans les modules précédents.
              </p>
            </div>

            {/* Badges - générés automatiquement */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">Badges (calculé automatiquement)</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p>Plastique souple: {formData.badges_plastic_soft_kg.toFixed(2)} kg</p>
                  <p>Plastique rigide: {formData.badges_plastic_rigid_kg.toFixed(2)} kg</p>
                  <p>Textile: {formData.badges_textile_kg.toFixed(2)} kg</p>
                </div>
                <div>
                  <p>Papier: {formData.badges_paper_kg.toFixed(2)} kg</p>
                  <p>Aluminium: {formData.badges_aluminum_kg.toFixed(2)} kg</p>
                </div>
              </div>
            </div>

            {/* Vaisselle */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">Vaisselle (calculé automatiquement)</h4>
              
              <div className="text-sm text-gray-600">
                <p>Plastique PET: {formData.dishware_plastic_kg.toFixed(2)} kg</p>
                <p>Carton: {formData.dishware_cardboard_kg.toFixed(2)} kg</p>
              </div>
            </div>

            {/* Communication */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">Supports de communication (calculé automatiquement)</h4>
              
              <div className="text-sm text-gray-600">
                <p>Papier: {formData.comm_paper_kg.toFixed(2)} kg</p>
                <p>Plastique: {formData.comm_plastic_kg.toFixed(2)} kg</p>
                <p>Aluminium: {formData.comm_aluminum_kg.toFixed(2)} kg</p>
              </div>
            </div>

            {/* Déchets divers - saisie manuelle */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3 flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Déchets divers (saisie manuelle)
              </h4>
              
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 mb-1">
                  <div className="col-span-6">Type de déchet</div>
                  <div className="col-span-3">Poids (kg)</div>
                  <div className="col-span-3">kgCO2e</div>
                </div>
                
                {formData.misc_waste.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <div className="col-span-6">
                      <Select 
                        value={item.type} 
                        onValueChange={(val) => handleMiscChange(index, 'type', val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Type de déchet..." />
                        </SelectTrigger>
                        <SelectContent>
                          {WASTE_TYPES.map(type => (
                            <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.weight || ''}
                        onChange={(e) => handleMiscChange(index, 'weight', parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-3 text-xs text-[#0d5f4d] font-medium flex items-center">
                      {calculatedEmissions.misc_emissions[index]?.toFixed(2) || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* COLONNE DROITE - CALCULS */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#f0f7f5] py-3 border-b border-[#0d5f4d]">
            <CardTitle className="flex items-center gap-2 text-lg text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Calculator className="h-5 w-5" />
              10. Déchets - Émissions calculées
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">Badges, vaisselle et communication</h4>
            <div className="space-y-1 mb-4">
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Déchets badges</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.total_badges.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
              
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Déchets vaisselle</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.total_dishware.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
              
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Déchets communication</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.total_communication.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">Déchets divers</h4>
            <div className="space-y-1 mb-4">
              {formData.misc_waste.map((item, index) => (
                item.type && item.weight > 0 && (
                  <div key={index} className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                    <div className="col-span-7">{WASTE_TYPES.find(w => w.id === item.type)?.label}</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.misc_emissions[index]?.toFixed(1) || 0}
                    </div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                )
              ))}
              
              <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                <div className="col-span-7 font-semibold">Total déchets divers</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.total_misc.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
            </div>

            <div className="border-t-2 border-[#0d5f4d] pt-3">
              <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded text-sm">
                <div className="col-span-7 font-bold">TOTAL DÉCHETS</div>
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
            data-testid="save-waste-btn"
            onClick={handleSave}
            className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-8 py-3 text-base"
          >
            Enregistrer la section Déchets
          </Button>
        </div>
      )}
    </div>
  );
};

export default WasteSection;
