import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Calculator, Package } from "lucide-react";

// Modes de transport et facteurs d'émission (source: hypotheses/fret/approche_par_les_distances.json)
const TRANSPORT_MODES = [
  { id: "camion_20t", label: "Camion 20 tonnes", factor: 0.106 },
  { id: "camion_40t", label: "Camion 40 tonnes", factor: 0.083 },
  { id: "camionnette", label: "Camionnette", factor: 0.195 },
  { id: "utilitaire", label: "Véhicule utilitaire léger", factor: 0.234 },
  { id: "train_fret", label: "Train fret", factor: 0.0052 },
  { id: "avion_cargo_court", label: "Avion cargo < 500 km", factor: 2.37 },
  { id: "avion_cargo_moyen", label: "Avion cargo 500-1000 km", factor: 1.54 },
  { id: "avion_cargo_long", label: "Avion cargo > 1000 km", factor: 0.86 },
  { id: "bateau_conteneur", label: "Porte-conteneurs", factor: 0.016 },
];

// Ratios monétaires pour l'approche par les dépenses
const EXPENSE_RATIOS = {
  routier_ferroviaire: 850, // kgCO2e/k€
  aerien: 3200, // kgCO2e/k€
};

const FreightSection = ({ onSave, initialData, eventData, calculatedValues }) => {
  const [formData, setFormData] = useState({
    knows_details: "Aucune de ces données",
    
    // 9.1 Approche par les distances
    // 9.1.1 Convoiement des œuvres d'art (événements culturels)
    art_transport: [
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
    ],
    
    // 9.1.2 Autres marchandises
    decor_transport: [
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
    ],
    material_transport: [
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
    ],
    catering_transport: [
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
    ],
    communication_transport: [
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
    ],
    other_transport: [
      { mode: "", distance: 0, vehicles: 0, weight: 0 },
    ],
    
    // 9.2 Approche par les dépenses
    road_rail_expenses: 0,
    air_expenses: 0,
    
    ...initialData,
  });

  const [calculatedEmissions, setCalculatedEmissions] = useState({
    art_emissions: [],
    decor_emissions: [],
    material_emissions: [],
    catering_emissions: [],
    communication_emissions: [],
    other_emissions: [],
    total_distances: 0,
    road_rail_expense_emissions: 0,
    air_expense_emissions: 0,
    total_expenses: 0,
    total: 0,
  });

  const eventType = eventData?.event_type || calculatedValues?.event_type || "Evenement_culturel";
  const isCultural = eventType === "Evenement_culturel";

  const getOrientationMessage = () => {
    if (formData.knows_details === "Les distances parcourues par les marchandises et les types de véhicules") {
      return "Remplir l'onglet 9.1. Approche par les distances";
    } else if (formData.knows_details === "Les dépenses en logistique") {
      return "Remplir l'onglet 9.2. Approche par les dépenses";
    }
    return "Ce poste ne sera pas comptabilisé dans les calculs. Allez directement à l'onglet 10.Déchets";
  };

  const calculateTransportEmissions = (items) => {
    return items.map(item => {
      if (!item.mode || !item.distance || !item.weight) return 0;
      const mode = TRANSPORT_MODES.find(m => m.id === item.mode);
      if (!mode) return 0;
      // Formule: distance × poids × facteur / 1000 (conversion en tonne.km)
      return (item.distance * item.weight * mode.factor) / 1000;
    });
  };

  const calculateEmissions = useCallback(() => {
    // 9.1 Approche par les distances
    const artEmissions = calculateTransportEmissions(formData.art_transport);
    const decorEmissions = calculateTransportEmissions(formData.decor_transport);
    const materialEmissions = calculateTransportEmissions(formData.material_transport);
    const cateringEmissions = calculateTransportEmissions(formData.catering_transport);
    const communicationEmissions = calculateTransportEmissions(formData.communication_transport);
    const otherEmissions = calculateTransportEmissions(formData.other_transport);

    const totalDistances = [
      ...artEmissions,
      ...decorEmissions,
      ...materialEmissions,
      ...cateringEmissions,
      ...communicationEmissions,
      ...otherEmissions,
    ].reduce((sum, e) => sum + e, 0);

    // 9.2 Approche par les dépenses
    const roadRailExpenseEmissions = formData.road_rail_expenses * EXPENSE_RATIOS.routier_ferroviaire / 1000;
    const airExpenseEmissions = formData.air_expenses * EXPENSE_RATIOS.aerien / 1000;
    const totalExpenses = roadRailExpenseEmissions + airExpenseEmissions;

    // Total selon l'approche choisie
    let total = 0;
    if (formData.knows_details === "Les distances parcourues par les marchandises et les types de véhicules") {
      total = totalDistances;
    } else if (formData.knows_details === "Les dépenses en logistique") {
      total = totalExpenses;
    }

    setCalculatedEmissions({
      art_emissions: artEmissions,
      decor_emissions: decorEmissions,
      material_emissions: materialEmissions,
      catering_emissions: cateringEmissions,
      communication_emissions: communicationEmissions,
      other_emissions: otherEmissions,
      total_distances: totalDistances,
      road_rail_expense_emissions: roadRailExpenseEmissions,
      air_expense_emissions: airExpenseEmissions,
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

  const handleTransportChange = (arrayName, index, field, value) => {
    const newArray = [...formData[arrayName]];
    newArray[index] = { ...newArray[index], [field]: value };
    setFormData(prev => ({ ...prev, [arrayName]: newArray }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...formData,
        total_emissions: calculatedEmissions.total,
      });
    }
  };

  const showDistances = formData.knows_details === "Les distances parcourues par les marchandises et les types de véhicules";
  const showExpenses = formData.knows_details === "Les dépenses en logistique";

  const renderTransportRow = (item, index, arrayName, emissions) => (
    <div key={index} className="grid grid-cols-12 gap-1 mb-2">
      <div className="col-span-4">
        <Select 
          value={item.mode} 
          onValueChange={(val) => handleTransportChange(arrayName, index, 'mode', val)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Mode..." />
          </SelectTrigger>
          <SelectContent>
            {TRANSPORT_MODES.map(m => (
              <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          min="0"
          value={item.distance || ''}
          onChange={(e) => handleTransportChange(arrayName, index, 'distance', parseFloat(e.target.value) || 0)}
          className="h-8 text-xs"
          placeholder="km"
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          min="0"
          value={item.vehicles || ''}
          onChange={(e) => handleTransportChange(arrayName, index, 'vehicles', parseInt(e.target.value) || 0)}
          className="h-8 text-xs"
          placeholder="véh."
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          min="0"
          value={item.weight || ''}
          onChange={(e) => handleTransportChange(arrayName, index, 'weight', parseFloat(e.target.value) || 0)}
          className="h-8 text-xs"
          placeholder="kg"
        />
      </div>
      <div className="col-span-2 text-xs text-[#0d5f4d] font-medium flex items-center">
        {emissions[index]?.toFixed(1) || 0}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* COLONNE GAUCHE - SAISIE */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Truck className="h-5 w-5" />
              9. Fret - Saisie des données
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm font-medium">Je connais...</Label>
              <div className="col-span-2">
                <Select 
                  value={formData.knows_details} 
                  onValueChange={(val) => handleChange('knows_details', val)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Les distances parcourues par les marchandises et les types de véhicules">
                      Les distances et types de véhicules
                    </SelectItem>
                    <SelectItem value="Les dépenses en logistique">Les dépenses en logistique</SelectItem>
                    <SelectItem value="Aucune de ces données">Aucune de ces données</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-[#f0f7f5] border border-[#0d5f4d] rounded-lg p-3">
              <p className="text-sm text-[#0d5f4d] font-medium">→ {getOrientationMessage()}</p>
            </div>

            {showDistances && (
              <>
                {/* Convoiement des œuvres d'art (événements culturels) */}
                {isCultural && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">
                      9.1.1. Convoiement des œuvres d'art
                    </h4>
                    <div className="grid grid-cols-12 gap-1 text-xs font-medium text-gray-600 mb-2">
                      <div className="col-span-4">Mode</div>
                      <div className="col-span-2">Dist.(km)</div>
                      <div className="col-span-2">Véhicules</div>
                      <div className="col-span-2">Poids(kg)</div>
                      <div className="col-span-2">kgCO2</div>
                    </div>
                    {formData.art_transport.map((item, index) => 
                      renderTransportRow(item, index, 'art_transport', calculatedEmissions.art_emissions)
                    )}
                  </div>
                )}

                {/* Autres marchandises */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    9.1.2. Transport des décors et aménagements
                  </h4>
                  <div className="grid grid-cols-12 gap-1 text-xs font-medium text-gray-600 mb-2">
                    <div className="col-span-4">Mode</div>
                    <div className="col-span-2">Dist.</div>
                    <div className="col-span-2">Véh.</div>
                    <div className="col-span-2">Poids</div>
                    <div className="col-span-2">kgCO2</div>
                  </div>
                  {formData.decor_transport.map((item, index) => 
                    renderTransportRow(item, index, 'decor_transport', calculatedEmissions.decor_emissions)
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">Transport du matériel</h4>
                  {formData.material_transport.map((item, index) => 
                    renderTransportRow(item, index, 'material_transport', calculatedEmissions.material_emissions)
                  )}
                </div>
              </>
            )}

            {showExpenses && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">9.2. Approche par les dépenses</h4>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">Fret routier et ferroviaire</Label>
                    <div className="col-span-2 flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData.road_rail_expenses || ''}
                        onChange={(e) => handleChange('road_rail_expenses', parseFloat(e.target.value) || 0)}
                        className="h-9"
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-500">€</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">Fret aérien</Label>
                    <div className="col-span-2 flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData.air_expenses || ''}
                        onChange={(e) => handleChange('air_expenses', parseFloat(e.target.value) || 0)}
                        className="h-9"
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-500">€</span>
                    </div>
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
              9. Fret - Émissions calculées
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {(showDistances || showExpenses) ? (
              <>
                {showDistances && (
                  <>
                    <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">9.1. Approche par les distances</h4>
                    <div className="space-y-1 mb-4">
                      <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                        <div className="col-span-7 font-semibold">Total fret (distances)</div>
                        <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                          {calculatedEmissions.total_distances.toFixed(1)}
                        </div>
                        <div className="col-span-2 text-gray-600">kgCO2e</div>
                      </div>
                    </div>
                  </>
                )}

                {showExpenses && (
                  <>
                    <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">9.2. Approche par les dépenses</h4>
                    <div className="space-y-1 mb-4">
                      <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                        <div className="col-span-7">Fret routier et ferroviaire</div>
                        <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                          {calculatedEmissions.road_rail_expense_emissions.toFixed(1)}
                        </div>
                        <div className="col-span-2 text-gray-600">kgCO2e</div>
                      </div>
                      <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                        <div className="col-span-7">Fret aérien</div>
                        <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                          {calculatedEmissions.air_expense_emissions.toFixed(1)}
                        </div>
                        <div className="col-span-2 text-gray-600">kgCO2e</div>
                      </div>
                      <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                        <div className="col-span-7 font-semibold">Total fret (dépenses)</div>
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
                    <div className="col-span-7 font-bold">TOTAL FRET</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d] text-lg">
                      {calculatedEmissions.total.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
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
            data-testid="save-freight-btn"
            onClick={handleSave}
            className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-8 py-3 text-base"
          >
            Enregistrer la section Fret
          </Button>
        </div>
      )}
    </div>
  );
};

export default FreightSection;
