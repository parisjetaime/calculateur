import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Calculator, Flame, Building, ThermometerSun, Snowflake } from "lucide-react";

// Facteurs d'émission pour l'énergie (source: Base Carbone - fichier hypotheses/energie/combustibles.json)
const ENERGY_FACTORS = {
  gas_kwh: 0.216,        // kgCO2e/kWh PCS - Gaz
  fuel_liter: 3.25,      // kgCO2e/L - Fioul
  electricity_kwh: 0.052, // kgCO2e/kWhe - Électricité
  coal_kg: 3.25,         // kgCO2e/kg - Charbon
};

// Types de bâtiments pour l'approche estimée
const BUILDING_TYPES = [
  { id: "bureaux", label: "Bureaux" },
  { id: "commerces", label: "Commerces" },
  { id: "sante", label: "Santé" },
  { id: "hotels_restaurants", label: "Hôtels et restaurants" },
  { id: "sport_loisir_culture", label: "Sport, loisir et culture" },
  { id: "enseignement", label: "Enseignement" },
];

// Facteurs CEREN par type de bâtiment (kgCO2e/m²/an)
const CEREN_FACTORS = {
  bureaux: { chauffage: 12.896, climatisation: 5.2313, electricite: 19.7532 },
  commerces: { chauffage: 15.2, climatisation: 8.5, electricite: 45.3 },
  sante: { chauffage: 18.5, climatisation: 12.3, electricite: 52.1 },
  hotels_restaurants: { chauffage: 22.1, climatisation: 15.2, electricite: 38.5 },
  sport_loisir_culture: { chauffage: 14.2, climatisation: 6.8, electricite: 28.3 },
  enseignement: { chauffage: 11.5, climatisation: 3.2, electricite: 15.8 },
};

// Réseaux de chaleur par ville (facteur kgCO2e/kWh) - échantillon
const HEAT_NETWORKS = [
  { id: "paris_cpcu", label: "Paris - CPCU", factor: 0.115 },
  { id: "paris_climespace", label: "Paris - Climespace (froid)", factor: 0.018, isCold: true },
  { id: "lyon_tcl", label: "Lyon - TCL", factor: 0.089 },
  { id: "bordeaux", label: "Bordeaux", factor: 0.078 },
  { id: "grenoble", label: "Grenoble", factor: 0.065 },
  { id: "nantes", label: "Nantes", factor: 0.095 },
  { id: "autre", label: "Autre / Moyenne France", factor: 0.125 },
];

const EnergySection = ({ onSave, initialData, eventData, calculatedValues }) => {
  const [formData, setFormData] = useState({
    // Lieu de l'événement
    event_location: "En intérieur", // "En intérieur" ou "En extérieur"
    knows_consumption: "Oui", // "Oui" ou "Non"
    
    // 2.1 Approche réelle - Combustibles
    gas_kwh: 0,
    fuel_liters: 0,
    electricity_kwh: 0,
    coal_kg: 0,
    
    // Réseaux de chaleur et de froid
    heat_network_city: "",
    heat_network_kwh: 0,
    cold_network_kwh: 0,
    
    // Groupes électrogènes
    has_generators: "Non",
    generator_1_power: 0,
    generator_1_hours: 0,
    generator_1_count: 0,
    generator_2_power: 0,
    generator_2_hours: 0,
    generator_2_count: 0,
    generator_3_power: 0,
    generator_3_hours: 0,
    generator_3_count: 0,
    
    // 2.2 Approche estimée
    building_type: "",
    surface_m2: 0,
    
    ...initialData,
  });

  const [calculatedEmissions, setCalculatedEmissions] = useState({
    gas: 0,
    fuel: 0,
    electricity: 0,
    coal: 0,
    heat_network: 0,
    cold_network: 0,
    generators: 0,
    total_real: 0,
    heating_estimated: 0,
    cooling_estimated: 0,
    electricity_estimated: 0,
    total_estimated: 0,
    total: 0,
  });

  // Obtenir le message d'orientation selon les choix
  const getOrientationMessage = () => {
    const { event_location, knows_consumption } = formData;
    
    if (knows_consumption === "Oui") {
      return "Remplir l'onglet 2.1. Approche par la consommation énergétique réelle";
    } else if (knows_consumption === "Non" && event_location === "En extérieur") {
      return "Ce poste ne sera pas comptabilisé dans les calculs. Allez directement à l'onglet 3. Transport";
    } else if (knows_consumption === "Non" && event_location === "En intérieur") {
      return "Remplir l'onglet 2.2. Approche par la consommation énergétique estimée";
    }
    return "";
  };

  // Calculer les émissions
  const calculateEmissions = useCallback(() => {
    const {
      gas_kwh, fuel_liters, electricity_kwh, coal_kg,
      heat_network_city, heat_network_kwh, cold_network_kwh,
      has_generators, generator_1_power, generator_1_hours, generator_1_count,
      generator_2_power, generator_2_hours, generator_2_count,
      generator_3_power, generator_3_hours, generator_3_count,
      building_type, surface_m2, knows_consumption
    } = formData;

    // Émissions combustibles
    const gasEmissions = gas_kwh * ENERGY_FACTORS.gas_kwh;
    const fuelEmissions = fuel_liters * ENERGY_FACTORS.fuel_liter;
    const electricityEmissions = electricity_kwh * ENERGY_FACTORS.electricity_kwh;
    const coalEmissions = coal_kg * ENERGY_FACTORS.coal_kg;

    // Émissions réseau de chaleur
    const heatNetwork = HEAT_NETWORKS.find(n => n.id === heat_network_city);
    const heatNetworkEmissions = heatNetwork && !heatNetwork.isCold 
      ? heat_network_kwh * heatNetwork.factor 
      : 0;

    // Émissions réseau de froid
    const coldNetworkEmissions = heatNetwork?.isCold 
      ? cold_network_kwh * heatNetwork.factor
      : 0;

    // Émissions groupes électrogènes
    let generatorEnergy = 0;
    if (has_generators === "Oui") {
      generatorEnergy += generator_1_power * generator_1_hours * generator_1_count;
      generatorEnergy += generator_2_power * generator_2_hours * generator_2_count;
      generatorEnergy += generator_3_power * generator_3_hours * generator_3_count;
    }
    const generatorEmissions = generatorEnergy * ENERGY_FACTORS.electricity_kwh;

    // Total approche réelle
    const totalReal = gasEmissions + fuelEmissions + electricityEmissions + 
                      coalEmissions + heatNetworkEmissions + coldNetworkEmissions + 
                      generatorEmissions;

    // Approche estimée
    let heatingEstimated = 0;
    let coolingEstimated = 0;
    let electricityEstimated = 0;

    if (knows_consumption === "Non" && building_type && surface_m2 > 0) {
      const factors = CEREN_FACTORS[building_type];
      const eventDuration = calculatedValues?.event_duration || 1;
      const daysPerYear = 365;
      
      if (factors) {
        // TODO: Prendre en compte si c'est chauffage ou climatisation selon la saison
        heatingEstimated = (factors.chauffage * surface_m2 * eventDuration) / daysPerYear;
        coolingEstimated = (factors.climatisation * surface_m2 * eventDuration) / daysPerYear;
        electricityEstimated = (factors.electricite * surface_m2 * eventDuration) / daysPerYear;
      }
    }

    const totalEstimated = heatingEstimated + coolingEstimated + electricityEstimated;

    // Total général (on prend soit réel soit estimé)
    const total = knows_consumption === "Oui" ? totalReal : totalEstimated;

    setCalculatedEmissions({
      gas: gasEmissions,
      fuel: fuelEmissions,
      electricity: electricityEmissions,
      coal: coalEmissions,
      heat_network: heatNetworkEmissions,
      cold_network: coldNetworkEmissions,
      generators: generatorEmissions,
      total_real: totalReal,
      heating_estimated: heatingEstimated,
      cooling_estimated: coolingEstimated,
      electricity_estimated: electricityEstimated,
      total_estimated: totalEstimated,
      total,
    });
  }, [formData, calculatedValues]);

  useEffect(() => {
    calculateEmissions();
  }, [calculateEmissions]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...formData,
        approach: formData.knows_consumption === "Oui" ? "real" : "estimated",
        total_emissions: calculatedEmissions.total,
      });
    }
  };

  const showRealApproach = formData.knows_consumption === "Oui";
  const showEstimatedApproach = formData.knows_consumption === "Non" && formData.event_location === "En intérieur";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ===== COLONNE GAUCHE - SAISIE ===== */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Zap className="h-5 w-5" />
              2. Énergie - Saisie des données
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Lieu de l'événement */}
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm font-medium">L'événement a lieu…</Label>
              <div className="col-span-2">
                <Select 
                  value={formData.event_location} 
                  onValueChange={(val) => handleChange('event_location', val)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="En intérieur">En intérieur</SelectItem>
                    <SelectItem value="En extérieur">En extérieur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Connaissance de la consommation */}
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm font-medium">Je connais la consommation énergétique</Label>
              <div className="col-span-2">
                <Select 
                  value={formData.knows_consumption} 
                  onValueChange={(val) => handleChange('knows_consumption', val)}
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

            {/* Message d'orientation */}
            <div className="bg-[#f0f7f5] border border-[#0d5f4d] rounded-lg p-3">
              <p className="text-sm text-[#0d5f4d] font-medium">
                → {getOrientationMessage()}
              </p>
            </div>

            {/* 2.1 Approche par la consommation réelle */}
            {showRealApproach && (
              <>
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3 flex items-center gap-2">
                    <Flame className="h-4 w-4" />
                    2.1. Approche par la consommation énergétique réelle
                  </h4>
                  
                  <p className="text-xs text-gray-600 mb-3">Combustibles et électricité</p>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-sm">Gaz</Label>
                      <div className="col-span-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={formData.gas_kwh || ''}
                          onChange={(e) => handleChange('gas_kwh', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                        <span className="text-sm text-gray-500 w-12">kWh</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-sm">Fioul</Label>
                      <div className="col-span-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={formData.fuel_liters || ''}
                          onChange={(e) => handleChange('fuel_liters', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                        <span className="text-sm text-gray-500 w-12">L</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-sm">Électricité</Label>
                      <div className="col-span-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={formData.electricity_kwh || ''}
                          onChange={(e) => handleChange('electricity_kwh', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                        <span className="text-sm text-gray-500 w-12">kWh</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-sm">Charbon</Label>
                      <div className="col-span-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={formData.coal_kg || ''}
                          onChange={(e) => handleChange('coal_kg', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                        <span className="text-sm text-gray-500 w-12">kg</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Réseaux de chaleur et de froid */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-3 flex items-center gap-1">
                    <ThermometerSun className="h-4 w-4" />
                    Réseaux de chaleur et de froid
                  </p>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-sm">Ville</Label>
                      <div className="col-span-2">
                        <Select 
                          value={formData.heat_network_city} 
                          onValueChange={(val) => handleChange('heat_network_city', val)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Sélectionner une ville..." />
                          </SelectTrigger>
                          <SelectContent>
                            {HEAT_NETWORKS.map((network) => (
                              <SelectItem key={network.id} value={network.id}>
                                {network.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-sm">Réseau de chaleur</Label>
                      <div className="col-span-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={formData.heat_network_kwh || ''}
                          onChange={(e) => handleChange('heat_network_kwh', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                        <span className="text-sm text-gray-500 w-12">kWh</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-sm">Réseau de froid</Label>
                      <div className="col-span-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={formData.cold_network_kwh || ''}
                          onChange={(e) => handleChange('cold_network_kwh', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                        <span className="text-sm text-gray-500 w-12">kWh</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Groupes électrogènes */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-3">Groupes électrogènes</p>
                  
                  <div className="grid grid-cols-3 gap-2 items-center mb-3">
                    <Label className="text-sm">Des groupes électrogènes vont-ils être utilisés ?</Label>
                    <div className="col-span-2">
                      <Select 
                        value={formData.has_generators} 
                        onValueChange={(val) => handleChange('has_generators', val)}
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

                  {formData.has_generators === "Oui" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-600 mb-1">
                        <div></div>
                        <div>Puissance (kW)</div>
                        <div>Temps (h)</div>
                        <div>Nombre</div>
                      </div>
                      
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="grid grid-cols-4 gap-2">
                          <Label className="text-xs text-gray-500 self-center">Groupe {i}</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData[`generator_${i}_power`] || ''}
                            onChange={(e) => handleChange(`generator_${i}_power`, parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                          <Input
                            type="number"
                            min="0"
                            value={formData[`generator_${i}_hours`] || ''}
                            onChange={(e) => handleChange(`generator_${i}_hours`, parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                          <Input
                            type="number"
                            min="0"
                            value={formData[`generator_${i}_count`] || ''}
                            onChange={(e) => handleChange(`generator_${i}_count`, parseInt(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 2.2 Approche par la consommation estimée */}
            {showEstimatedApproach && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  2.2. Approche par la consommation énergétique estimée
                </h4>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">Type de bâtiment</Label>
                    <div className="col-span-2">
                      <Select 
                        value={formData.building_type} 
                        onValueChange={(val) => handleChange('building_type', val)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {BUILDING_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">Surface brute occupée</Label>
                    <div className="col-span-2 flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData.surface_m2 || ''}
                        onChange={(e) => handleChange('surface_m2', parseFloat(e.target.value) || 0)}
                        className="h-9"
                      />
                      <span className="text-sm text-gray-500">m²</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== COLONNE DROITE - PARAMETRES CALCULES ===== */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#f0f7f5] py-3 border-b border-[#0d5f4d]">
            <CardTitle className="flex items-center gap-2 text-lg text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Calculator className="h-5 w-5" />
              2. Énergie - Émissions calculées
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {showRealApproach && (
              <>
                {/* 2.1 Approche réelle */}
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">
                  2.1. Approche par la consommation réelle
                </h4>
                
                <div className="space-y-1">
                  <div className="grid grid-cols-12 gap-2 py-2 border-b-2 border-[#0d5f4d] bg-[#f0f7f5] px-2 rounded-t">
                    <div className="col-span-7 text-sm font-semibold text-[#0d5f4d]">Combustible</div>
                    <div className="col-span-3 text-sm font-semibold text-[#0d5f4d] text-right">Émissions</div>
                    <div className="col-span-2 text-sm font-semibold text-[#0d5f4d]">Unité</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm">Gaz</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.gas.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm">Fioul</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.fuel.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm">Électricité</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.electricity.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm">Charbon</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.coal.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="border-t border-gray-200 my-2"></div>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm">Réseau chaleur</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.heat_network.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm">Réseau froid</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.cold_network.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm">Total groupes électrogènes</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.generators.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="border-t border-gray-200 my-2"></div>

                  <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded">
                    <div className="col-span-7 text-sm font-semibold">Total énergie</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.total_real.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>
                </div>
              </>
            )}

            {showEstimatedApproach && (
              <>
                {/* 2.2 Approche estimée */}
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">
                  2.2. Approche par la consommation estimée
                </h4>
                
                <div className="space-y-1">
                  <div className="grid grid-cols-12 gap-2 py-2 border-b-2 border-[#0d5f4d] bg-[#f0f7f5] px-2 rounded-t">
                    <div className="col-span-7 text-sm font-semibold text-[#0d5f4d]">Poste</div>
                    <div className="col-span-3 text-sm font-semibold text-[#0d5f4d] text-right">Émissions</div>
                    <div className="col-span-2 text-sm font-semibold text-[#0d5f4d]">Unité</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm flex items-center gap-1">
                      <ThermometerSun className="h-3 w-3" />
                      Émissions GES chauffage
                    </div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.heating_estimated.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm flex items-center gap-1">
                      <Snowflake className="h-3 w-3" />
                      Émissions GES climatisation
                    </div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.cooling_estimated.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Émissions GES électricité
                    </div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.electricity_estimated.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="border-t border-gray-200 my-2"></div>

                  <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded">
                    <div className="col-span-7 text-sm font-semibold">Total</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.total_estimated.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>
                </div>
              </>
            )}

            {!showRealApproach && !showEstimatedApproach && (
              <div className="text-center py-8 text-gray-500">
                <Zap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Ce poste ne sera pas comptabilisé.</p>
                <p className="text-sm">Passez au module suivant.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bouton de sauvegarde */}
      {onSave && (
        <div className="mt-6 flex justify-center">
          <Button
            data-testid="save-energy-btn"
            onClick={handleSave}
            className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-8 py-3 text-base"
          >
            Enregistrer la section Énergie
          </Button>
        </div>
      )}
    </div>
  );
};

export default EnergySection;
