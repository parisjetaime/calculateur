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

// Réseaux de chaleur par département et ville (source: hypotheses/energie/reseaux_chaleur.json)
const HEAT_NETWORKS = {
  "Essonne": {
    "BONDOUFLE": 0.115,
    "BRETIGNY-SUR-ORGE": 0.091,
    "Bruyeres-le-Chatel": 0.219,
    "DOURDAN": 0.279,
    "Epinay-sous-Senart": 0.078,
    "Evry": 0.146,
    "Grigny": 0.196,
    "LES ULIS": 0.09,
    "Massy": 0.113,
    "PALAISEAU": 0.094,
    "Ris-Orangis": 0.022,
    "Saclay": 0.19,
    "Sainte-Genevieve-des-Bois": 0.346,
    "Saint-Michel-Sur-Orge": 0.298,
    "VIGNEUX SUR SEINE": 0.066,
    "Villejust": 0.004,
    "Viry-Chatillon": 0.242
  },
  "Hauts-de-Seine": {
    "BAGNEUX": 0.087,
    "BOULOGNE-BILLANCOURT": 0.114,
    "Chaville": 0.247,
    "CLICHY": 0.258,
    "Colombes": 0.351,
    "Courbevoie": 0.271,
    "Gennevilliers": 0.118,
    "LEVALLOIS PERRET": 0.203,
    "Meudon": 0.263,
    "NANTERRE": 0.107,
    "Puteaux": 0.254,
    "Suresnes": 0.269,
    "Villeneuve-la-garenne": 0.256
  },
  "Paris": {
    "PARIS": 0.18
  },
  "Seine-et-Marne": {
    "Avon": 0.259,
    "BAILLY-ROMAINVILLIERS": 0.048,
    "BUSSY-SAINT-GEORGES": 0.295,
    "Chelles": 0.159,
    "Chessy": 0.263,
    "Coulommiers": 0.026,
    "Dammarie-les-Lys": 0.03,
    "LE MEE-SUR-SEINE": 0.076,
    "Meaux": 0.122,
    "Melun": 0.089,
    "Montereau-Fault-Yonne": 0.028,
    "Nemours": 0.148,
    "OZOIR-LA-FERRIERE": 0.184,
    "ROISSY-EN-BRIE": 0.123,
    "Torcy": 0.045,
    "Vaux-le-Penil": 0.149,
    "VILLENEUVE-SAINT-DENIS": 0.017
  },
  "Seine-Saint-Denis": {
    "Aulnay-sous-Bois": 0.36,
    "Bagnolet": 0.175,
    "Bobigny": 0.23,
    "Bondy": 0.149,
    "Clichy-Sous-Bois": 0.255,
    "DRANCY": 0.201,
    "LA COURNEUVE": 0.09,
    "LE BLANC-MESNIL": 0.107,
    "LE BOURGET": 0.292,
    "NEUILLY SUR MARNE": 0.077,
    "ROSNY-SOUS-BOIS": 0.035,
    "Saint-Denis": 0.146,
    "SAINT-OUEN-SUR-SEINE": 0.096,
    "Sevran": 0.133,
    "TREMBLAY EN France": 0.071,
    "Villepinte": 0.063
  },
  "Val-d'Oise": {
    "Argenteuil": 0.049,
    "CERGY": 0.092,
    "Franconville": 0.254,
    "Garges-Les-Gonesse": 0.228,
    "GOUSSAINVILLE": 0.036,
    "Pontoise": 0.246,
    "ROISSY-EN-FRANCE": 0.241,
    "Sarcelles": 0.074,
    "TAVERNY": 0.21,
    "Villiers-le-Bel": 0.089
  },
  "Val-de-Marne": {
    "Alfortville": 0.037,
    "ARCUEIL": 0.041,
    "Bonneuil-sur-Marne": 0.032,
    "Cachan": 0.088,
    "Champigny-sur-Marne": 0.078,
    "CHEVILLY-LARUE": 0.093,
    "Creteil": 0.079,
    "FONTENAY-SOUS-BOIS": 0.215,
    "Fresnes": 0.102,
    "IVRY-SUR-SEINE": 0.1,
    "LIMEIL-BREVANNES": 0.084,
    "Maisons-alfort": 0.113,
    "Orly": 0.057,
    "RUNGIS": 0.008,
    "Sucy-en-Brie": 0.019,
    "Thiais": 0.032,
    "Villeneuve-Saint-Georges": 0.152,
    "Vitry-sur-Seine": 0.151
  },
  "Yvelines": {
    "ACHERES": 0.109,
    "CARRIERES-SOUS-POISSY": 0.153,
    "Carrieres-sur-Seine": 0.014,
    "LE CHESNAY": 0.247,
    "LES MUREAUX": 0.14,
    "Mantes-la-Jolie": 0.139,
    "Plaisir": 0.077,
    "Saint-Germain-en-Laye": 0.143,
    "Velizy-Villacoublay": 0.271,
    "Versailles": 0.29
  }
};

// Réseaux de froid par département et ville (source: hypotheses/energie/reseaux_froid.json)
const COLD_NETWORKS = {
  "Essonne": { "Saclay": 0.053 },
  "Hauts-de-Seine": {
    "Courbevoie": 0.023,
    "LEVALLOIS PERRET": 0.019,
    "Suresnes": 0.033,
    "Boulogne-Billancourt": 0.026
  },
  "Paris": { "PARIS": 0.016 },
  "Seine-Saint-Denis": {
    "LE BOURGET": 0.073,
    "Saint-Denis": 0.012
  },
  "Val-d'Oise": { "ROISSY-EN-FRANCE": 0.02 },
  "Val-de-Marne": { "Orly": 0.017 }
};

// Types de bâtiments et facteurs CEREN (source: hypotheses/energie/lieux_ceren_correspondance.json)
const BUILDING_TYPES = [
  { id: "Campus, incubateur ou université", label: "Campus, incubateur ou université", climatisation: 1.5, chauffage: 31.0, electricite: 0.8 },
  { id: "Centre culturel", label: "Centre culturel", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
  { id: "Centre de congrès", label: "Centre de congrès", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
  { id: "Château, musée ou monument", label: "Château, musée ou monument", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
  { id: "Grand équipement sportif", label: "Grand équipement sportif", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
  { id: "Restaurant, bar ou brasserie", label: "Restaurant, bar ou brasserie", climatisation: 1.6, chauffage: 48.6, electricite: 4.1 },
  { id: "Salle de spectacle", label: "Salle de spectacle", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
  { id: "Salle de réception, de réunion", label: "Salle de réception, de réunion", climatisation: 2.0, chauffage: 43.2, electricite: 6.3 },
  { id: "Hôtel ou autre type d'hébergement", label: "Hôtel ou autre type d'hébergement", climatisation: 1.6, chauffage: 48.6, electricite: 4.1 },
  { id: "Autre équipement sportif", label: "Autre équipement sportif", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
  { id: "Autre institution publique", label: "Autre institution publique", climatisation: 2.0, chauffage: 43.2, electricite: 6.3 },
  { id: "Grand parc d'exposition", label: "Grand parc d'exposition", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
  { id: "Auditorium", label: "Auditorium", climatisation: 2.0, chauffage: 43.2, electricite: 6.3 },
  { id: "Stade", label: "Stade", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
  { id: "Gymnase", label: "Gymnase", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
  { id: "Salle de spectacle polyvalente", label: "Salle de spectacle polyvalente", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
  { id: "Hippodrome", label: "Hippodrome", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
  { id: "Patinoire", label: "Patinoire", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
  { id: "Vélodrome", label: "Vélodrome", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
  { id: "Piscine", label: "Piscine", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
  { id: "Musées", label: "Musées", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
  { id: "Monuments", label: "Monuments", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
  { id: "Centre d'exposition", label: "Centre d'exposition", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
  { id: "Galeries d'art", label: "Galeries d'art", climatisation: 1.0, chauffage: 48.6, electricite: 4.3 },
];

// Générer la liste plate des villes pour le réseau de chaleur
const getAllHeatCities = () => {
  const cities = [];
  Object.entries(HEAT_NETWORKS).forEach(([dept, villes]) => {
    Object.entries(villes).forEach(([ville, factor]) => {
      cities.push({ id: `${dept}|${ville}`, label: `${ville} (${dept})`, factor, dept, ville });
    });
  });
  return cities.sort((a, b) => a.label.localeCompare(b.label));
};

// Générer la liste plate des villes pour le réseau de froid
const getAllColdCities = () => {
  const cities = [];
  Object.entries(COLD_NETWORKS).forEach(([dept, villes]) => {
    Object.entries(villes).forEach(([ville, factor]) => {
      cities.push({ id: `${dept}|${ville}`, label: `${ville} (${dept})`, factor, dept, ville });
    });
  });
  return cities.sort((a, b) => a.label.localeCompare(b.label));
};

const HEAT_CITIES = getAllHeatCities();
const COLD_CITIES = getAllColdCities();

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
    cold_network_city: "",
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
    generators_energy: 0,
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
      heat_network_city, heat_network_kwh, cold_network_city, cold_network_kwh,
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
    const heatCity = HEAT_CITIES.find(c => c.id === heat_network_city);
    const heatNetworkEmissions = heatCity ? heat_network_kwh * heatCity.factor : 0;

    // Émissions réseau de froid
    const coldCity = COLD_CITIES.find(c => c.id === cold_network_city);
    const coldNetworkEmissions = coldCity ? cold_network_kwh * coldCity.factor : 0;

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
      const buildingData = BUILDING_TYPES.find(b => b.id === building_type);
      const eventDuration = calculatedValues?.event_duration || 1;
      const daysPerYear = 365;
      
      if (buildingData) {
        // Formules Excel:
        // Chauffage = facteur_chauffage * surface * durée / 365
        // Climatisation = facteur_clim * surface * durée / 365
        // Électricité = facteur_elec * surface * durée / 365
        heatingEstimated = (buildingData.chauffage * surface_m2 * eventDuration) / daysPerYear;
        coolingEstimated = (buildingData.climatisation * surface_m2 * eventDuration) / daysPerYear;
        electricityEstimated = (buildingData.electricite * surface_m2 * eventDuration) / daysPerYear;
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
      generators_energy: generatorEnergy,
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

  // Calculer l'énergie des groupes électrogènes pour chaque ligne
  const getGeneratorEnergy = (power, hours, count) => {
    if (formData.has_generators !== "Oui") return "";
    if (!power && !hours && !count) return "";
    return (power * hours * count).toFixed(0);
  };

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
                          placeholder="0"
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
                          placeholder="0"
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
                          placeholder="0"
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
                          placeholder="0"
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
                    {/* Réseau de chaleur */}
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-sm">Réseau de chaleur</Label>
                      <div className="col-span-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={formData.heat_network_kwh || ''}
                          onChange={(e) => handleChange('heat_network_kwh', parseFloat(e.target.value) || 0)}
                          className="h-9 w-24"
                          placeholder="0"
                        />
                        <span className="text-xs text-gray-500">kWh</span>
                        <Select 
                          value={formData.heat_network_city} 
                          onValueChange={(val) => handleChange('heat_network_city', val)}
                        >
                          <SelectTrigger className="h-9 flex-1">
                            <SelectValue placeholder="Sélectionner une ville..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {HEAT_CITIES.map((city) => (
                              <SelectItem key={city.id} value={city.id}>
                                {city.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Réseau de froid */}
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-sm">Réseau de froid</Label>
                      <div className="col-span-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={formData.cold_network_kwh || ''}
                          onChange={(e) => handleChange('cold_network_kwh', parseFloat(e.target.value) || 0)}
                          className="h-9 w-24"
                          placeholder="0"
                        />
                        <span className="text-xs text-gray-500">kWh</span>
                        <Select 
                          value={formData.cold_network_city} 
                          onValueChange={(val) => handleChange('cold_network_city', val)}
                        >
                          <SelectTrigger className="h-9 flex-1">
                            <SelectValue placeholder="Sélectionner une ville..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {COLD_CITIES.map((city) => (
                              <SelectItem key={city.id} value={city.id}>
                                {city.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-600 mb-1">
                        <div></div>
                        <div>Puissance (kW)</div>
                        <div>Temps (h)</div>
                        <div>Nombre</div>
                        <div>Énergie (kWh)</div>
                      </div>
                      
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="grid grid-cols-5 gap-2">
                          <Label className="text-xs text-gray-500 self-center">Groupe {i}</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData[`generator_${i}_power`] || ''}
                            onChange={(e) => handleChange(`generator_${i}_power`, parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                            placeholder="0"
                          />
                          <Input
                            type="number"
                            min="0"
                            value={formData[`generator_${i}_hours`] || ''}
                            onChange={(e) => handleChange(`generator_${i}_hours`, parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                            placeholder="0"
                          />
                          <Input
                            type="number"
                            min="0"
                            value={formData[`generator_${i}_count`] || ''}
                            onChange={(e) => handleChange(`generator_${i}_count`, parseInt(e.target.value) || 0)}
                            className="h-8 text-sm"
                            placeholder="0"
                          />
                          <div className="h-8 flex items-center text-sm text-[#0d5f4d] font-medium bg-gray-50 rounded px-2">
                            {getGeneratorEnergy(
                              formData[`generator_${i}_power`],
                              formData[`generator_${i}_hours`],
                              formData[`generator_${i}_count`]
                            )}
                          </div>
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
                    <Label className="text-sm">Dans quel type de bâtiment l'événement aura-t-il lieu ?</Label>
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
                    <Label className="text-sm">Quelle surface brute occupée par l'événement (m²) ?</Label>
                    <div className="col-span-2 flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData.surface_m2 || ''}
                        onChange={(e) => handleChange('surface_m2', parseFloat(e.target.value) || 0)}
                        className="h-9"
                        placeholder="0"
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
                
                <p className="text-xs text-gray-600 mb-2">Combustibles et électricité</p>
                
                <div className="space-y-1">
                  <div className="grid grid-cols-12 gap-2 py-2 border-b-2 border-[#0d5f4d] bg-[#f0f7f5] px-2 rounded-t">
                    <div className="col-span-7 text-sm font-semibold text-[#0d5f4d]">Source</div>
                    <div className="col-span-3 text-sm font-semibold text-[#0d5f4d] text-right">Émissions</div>
                    <div className="col-span-2 text-sm font-semibold text-[#0d5f4d]">Unité</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm">Gaz</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.gas.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm">Fioul</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.fuel.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm">Électricité</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.electricity.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm">Charbon</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.coal.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="border-t border-gray-200 my-2"></div>
                  <p className="text-xs text-gray-600 mb-2">Réseaux de chaleur et de froid</p>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm">Réseau chaleur</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.heat_network.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm">Réseau froid</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.cold_network.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="border-t border-gray-200 my-2"></div>
                  <p className="text-xs text-gray-600 mb-2">Groupes électrogènes</p>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm">Total groupes électrogènes</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.generators.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="border-t-2 border-[#0d5f4d] my-2"></div>

                  <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded">
                    <div className="col-span-7 text-sm font-semibold">Total énergie</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.total_real.toFixed(1)}
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
                      {calculatedEmissions.heating_estimated.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm flex items-center gap-1">
                      <Snowflake className="h-3 w-3" />
                      Émissions GES climatisation
                    </div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.cooling_estimated.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                    <div className="col-span-7 text-sm flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Émissions GES électricité
                    </div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.electricity_estimated.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">kgCO2e</div>
                  </div>

                  <div className="border-t-2 border-[#0d5f4d] my-2"></div>

                  <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded">
                    <div className="col-span-7 text-sm font-semibold">Total</div>
                    <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.total_estimated.toFixed(1)}
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
