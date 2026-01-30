import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Calculator, FileText, Monitor } from "lucide-react";

// Types de supports physiques
const PAPER_SUPPORTS = [
  { id: "flyer_a5", label: "Flyer A5", factor: 0.012, weight: 0.005 },
  { id: "brochure_a4", label: "Brochure A4", factor: 0.045, weight: 0.020 },
  { id: "affiche_a3", label: "Affiche A3", factor: 0.085, weight: 0.035 },
  { id: "affiche_a2", label: "Affiche A2", factor: 0.12, weight: 0.050 },
  { id: "catalogue", label: "Catalogue", factor: 0.35, weight: 0.150 },
];

// Supports numériques
const DIGITAL_SUPPORTS = [
  { id: "email_campagne", label: "Campagne email (1000 envois)", factor: 4.0 },
  { id: "newsletter", label: "Newsletter (1000 envois)", factor: 3.5 },
  { id: "publication_reseaux", label: "Publication réseaux sociaux", factor: 0.02 },
];

// Streaming vidéo
const STREAMING_DEVICES = [
  { id: "smartphone", label: "Smartphone", factor: 0.036 },
  { id: "ordinateur_tv", label: "Ordinateur portable ou télévision", factor: 0.072 },
];

// Ratios monétaires pour l'approche par les dépenses
const EXPENSE_CATEGORIES = [
  { id: "activites_creatives", label: "Activités créatives, artistiques, culturelles", ratio: 420 },
  { id: "courrier", label: "Courrier", ratio: 850 },
  { id: "films_enregistrements", label: "Films, enregistrement sonores, télévision et radio", ratio: 380 },
  { id: "edition", label: "Édition", ratio: 920 },
];

const CommunicationSection = ({ onSave, initialData, eventData, calculatedValues }) => {
  const [formData, setFormData] = useState({
    knows_details: "Oui",
    
    // 8.1 Approche par les quantités
    paper_supports: [
      { type: "", quantity: 0 },
      { type: "", quantity: 0 },
      { type: "", quantity: 0 },
    ],
    kakemono_count: 0,
    
    digital_supports: [
      { type: "", quantity: 0 },
      { type: "", quantity: 0 },
    ],
    
    streaming: [
      { device: "", duration_min: 0, audience: 0, videos: 0 },
      { device: "", duration_min: 0, audience: 0, videos: 0 },
    ],
    
    // 8.2 Approche par les dépenses
    expense_items: [
      { category: "", amount: 0 },
      { category: "", amount: 0 },
    ],
    
    ...initialData,
  });

  const [calculatedEmissions, setCalculatedEmissions] = useState({
    paper_emissions: [],
    kakemono_emissions: 0,
    digital_emissions: [],
    streaming_emissions: [],
    total_physical: 0,
    total_digital: 0,
    total_quantities: 0,
    expense_emissions: [],
    total_expenses: 0,
    total: 0,
  });

  const eventType = eventData?.event_type || calculatedValues?.event_type || "Evenement_culturel";

  const getOrientationMessage = () => {
    if (formData.knows_details === "Oui") {
      return "Remplir l'onglet 8.1.Approche par les quantités";
    } else if (eventType === "Evenement_professionnel") {
      return "Des valeurs moyennes vont être utilisées. Allez directement à l'onglet 9.Fret";
    }
    return "Ce poste ne sera pas comptabilisé dans les calculs. Allez directement à l'onglet 9.Fret";
  };

  const calculateEmissions = useCallback(() => {
    // Supports papier
    const paperEmissions = formData.paper_supports.map(item => {
      if (!item.type || !item.quantity) return 0;
      const support = PAPER_SUPPORTS.find(s => s.id === item.type);
      return support ? item.quantity * support.factor : 0;
    });

    // Kakémonos (plastique + aluminium)
    const kakemonoEmissions = formData.kakemono_count * 2.5; // facteur composite

    const totalPhysical = paperEmissions.reduce((sum, e) => sum + e, 0) + kakemonoEmissions;

    // Supports numériques
    const digitalEmissions = formData.digital_supports.map(item => {
      if (!item.type || !item.quantity) return 0;
      const support = DIGITAL_SUPPORTS.find(s => s.id === item.type);
      return support ? item.quantity * support.factor : 0;
    });

    // Streaming vidéo
    const streamingEmissions = formData.streaming.map(item => {
      if (!item.device || !item.duration_min || !item.audience) return 0;
      const device = STREAMING_DEVICES.find(d => d.id === item.device);
      if (!device) return 0;
      // Formule: (durée en heures) × audience × nb_videos × facteur
      return (item.duration_min / 60) * item.audience * (item.videos || 1) * device.factor;
    });

    const totalDigital = digitalEmissions.reduce((sum, e) => sum + e, 0) + 
                         streamingEmissions.reduce((sum, e) => sum + e, 0);

    const totalQuantities = totalPhysical + totalDigital;

    // Approche par les dépenses
    const expenseEmissions = formData.expense_items.map(item => {
      if (!item.category || !item.amount) return 0;
      const category = EXPENSE_CATEGORIES.find(c => c.id === item.category);
      return category ? item.amount * category.ratio / 1000 : 0;
    });
    const totalExpenses = expenseEmissions.reduce((sum, e) => sum + e, 0);

    const total = formData.knows_details === "Oui" ? totalQuantities : 0;

    setCalculatedEmissions({
      paper_emissions: paperEmissions,
      kakemono_emissions: kakemonoEmissions,
      digital_emissions: digitalEmissions,
      streaming_emissions: streamingEmissions,
      total_physical: totalPhysical,
      total_digital: totalDigital,
      total_quantities: totalQuantities,
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

  const handleArrayChange = (arrayName, index, field, value) => {
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

  const showDetails = formData.knows_details === "Oui";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* COLONNE GAUCHE - SAISIE */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Megaphone className="h-5 w-5" />
              8. Communication - Saisie
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm font-medium">Je connais les types de supports</Label>
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
                {/* Supports physiques */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    8.1. Supports physiques
                  </h4>
                  
                  <p className="text-xs text-gray-600 mb-2">Supports en papier</p>
                  
                  {formData.paper_supports.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                      <div className="col-span-7">
                        <Select 
                          value={item.type} 
                          onValueChange={(val) => handleArrayChange('paper_supports', index, 'type', val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Type de support..." />
                          </SelectTrigger>
                          <SelectContent>
                            {PAPER_SUPPORTS.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity || ''}
                          onChange={(e) => handleArrayChange('paper_supports', index, 'quantity', parseInt(e.target.value) || 0)}
                          className="h-8 text-xs"
                          placeholder="Qté"
                        />
                      </div>
                      <div className="col-span-2 text-xs text-gray-500 flex items-center">unités</div>
                    </div>
                  ))}

                  <div className="mt-3 grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">Kakémonos</Label>
                    <div className="col-span-2 flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData.kakemono_count || ''}
                        onChange={(e) => handleChange('kakemono_count', parseInt(e.target.value) || 0)}
                        className="h-9"
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-500">unités</span>
                    </div>
                  </div>
                </div>

                {/* Supports numériques */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3 flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Supports numériques
                  </h4>
                  
                  {formData.digital_supports.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                      <div className="col-span-7">
                        <Select 
                          value={item.type} 
                          onValueChange={(val) => handleArrayChange('digital_supports', index, 'type', val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {DIGITAL_SUPPORTS.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity || ''}
                          onChange={(e) => handleArrayChange('digital_supports', index, 'quantity', parseInt(e.target.value) || 0)}
                          className="h-8 text-xs"
                          placeholder="Qté"
                        />
                      </div>
                      <div className="col-span-2 text-xs text-gray-500 flex items-center">unités</div>
                    </div>
                  ))}

                  <p className="text-xs text-gray-600 mt-3 mb-2">Streaming vidéo</p>
                  
                  {formData.streaming.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-1 mb-2">
                      <div className="col-span-4">
                        <Select 
                          value={item.device} 
                          onValueChange={(val) => handleArrayChange('streaming', index, 'device', val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Appareil..." />
                          </SelectTrigger>
                          <SelectContent>
                            {STREAMING_DEVICES.map(d => (
                              <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0"
                          value={item.duration_min || ''}
                          onChange={(e) => handleArrayChange('streaming', index, 'duration_min', parseInt(e.target.value) || 0)}
                          className="h-8 text-xs"
                          placeholder="min"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0"
                          value={item.audience || ''}
                          onChange={(e) => handleArrayChange('streaming', index, 'audience', parseInt(e.target.value) || 0)}
                          className="h-8 text-xs"
                          placeholder="audience"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0"
                          value={item.videos || ''}
                          onChange={(e) => handleArrayChange('streaming', index, 'videos', parseInt(e.target.value) || 0)}
                          className="h-8 text-xs"
                          placeholder="vidéos"
                        />
                      </div>
                      <div className="col-span-2 text-xs text-gray-500 flex items-center">
                        {calculatedEmissions.streaming_emissions[index]?.toFixed(1) || 0}
                      </div>
                    </div>
                  ))}
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
              8. Communication - Émissions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {showDetails ? (
              <>
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">Supports physiques</h4>
                <div className="space-y-1 mb-4">
                  {formData.paper_supports.map((item, index) => (
                    item.type && (
                      <div key={index} className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                        <div className="col-span-7">{PAPER_SUPPORTS.find(s => s.id === item.type)?.label}</div>
                        <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                          {calculatedEmissions.paper_emissions[index]?.toFixed(1) || 0}
                        </div>
                        <div className="col-span-2 text-gray-600">kgCO2e</div>
                      </div>
                    )
                  ))}
                  
                  {formData.kakemono_count > 0 && (
                    <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                      <div className="col-span-7">Kakémonos</div>
                      <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                        {calculatedEmissions.kakemono_emissions.toFixed(1)}
                      </div>
                      <div className="col-span-2 text-gray-600">kgCO2e</div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                    <div className="col-span-7 font-semibold">Total supports physiques</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.total_physical.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">Supports numériques</h4>
                <div className="space-y-1 mb-4">
                  <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                    <div className="col-span-7 font-semibold">Total supports numériques</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                      {calculatedEmissions.total_digital.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>

                <div className="border-t-2 border-[#0d5f4d] pt-3">
                  <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded text-sm">
                    <div className="col-span-7 font-bold">TOTAL COMMUNICATION</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d] text-lg">
                      {calculatedEmissions.total.toFixed(1)}
                    </div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Megaphone className="h-12 w-12 mx-auto mb-3 text-gray-300" />
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
            data-testid="save-communication-btn"
            onClick={handleSave}
            className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-8 py-3 text-base"
          >
            Enregistrer la section Communication
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommunicationSection;
